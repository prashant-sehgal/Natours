const jwt = require('jsonwebtoken')
const { promisify } = require('util')
const crypto = require('crypto')

const User = require('../models/userModel')
const AppError = require('../utils/AppError')
const CatchAsync = require('../utils/CatchAsync')
const Email = require('../utils/Email')

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id)

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    }

    if (process.env.NODE_ENV.trim() === 'production')
        cookieOptions.secure = true

    res.cookie('jwt', token, cookieOptions)

    // remove password from output
    user.password = undefined
    user.passwordConfirm = undefined
    user.passwordChangedAt = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    })
}

exports.signup = CatchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    })

    const url = `${req.protocol}://${req.get('host')}/me`
    await new Email(newUser, url).sendWelcome()

    createSendToken(newUser, 201, res)
})

exports.login = CatchAsync(async (req, res, next) => {
    const { email, password } = req.body

    // 1 Check if email and password exists
    if (!email || !password)
        return next(new AppError('Please provide email and password', 400))

    // 2 Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.correctPassword(password, user.password)))
        return next(new AppError('Incorrect email or password', 401))

    // 3 If everything ok, send the token to client
    createSendToken(user, 200, res)
})

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    })
    res.status(200).json({ status: 'success' })
}

exports.protect = CatchAsync(async (req, res, next) => {
    // 1) Get token and check if it's there
    let token

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }

    if (!token)
        return next(
            new AppError(
                'You are not logged in! Please login to get access',
                401
            )
        )

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id)
    if (!freshUser)
        return next(
            new AppError(
                'The user belonging to this token no longer exists',
                401
            )
        )

    // 4) Check if user change password after token is issued
    if (freshUser.changePasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password', 401))
    }

    // /Grant access
    req.user = freshUser
    res.locals.user = freshUser
    next()
})

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            //  Verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            )
            //   Check if user still exists
            const freshUser = await User.findById(decoded.id)
            if (!freshUser)
                return next(
                    new AppError(
                        'The user belonging to this token no longer exists',
                        401
                    )
                )

            //  Check if user change password after token is issued
            if (freshUser.changePasswordAfter(decoded.iat)) {
                return next(new AppError('User recently changed password', 401))
            }

            // there is a logged in user
            res.locals.user = freshUser
            return next()
        } catch (err) {
            return next()
        }
    }
    next()
}

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403
                )
            )
        }
        next()
    }
}

exports.forgotPassword = CatchAsync(async (req, res, next) => {
    // get user email based on posted email
    const user = await User.findOne({ email: req.body.email })
    if (!user)
        return next(new AppError('There is no user with email address', 404))

    // generate random token
    const resetToken = await user.createPasswordResetToken()
    user.save({ validateBeforeSave: false })

    try {
        // send it back on email
        const resetUrl = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/resetPassword/${resetToken}`
        // await sendEmail({
        //     email: user.email,
        //     sbject: 'Your password reset token (only valid for 10 min)',
        //     message,
        // })
        await new Email(user, resetUrl).sendPasswordReset()
    } catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        user.save({ validateBeforeSave: false })
        return next(new AppError('There was an error in sending email', 500))
    }

    res.status(200).json({
        status: 'success',
        message: 'Token sent to email',
    })
})

exports.resetPassword = CatchAsync(async (req, res, next) => {
    // get user based on token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    })

    //  if token has not expired and there is user, set new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }

    // update changedPasswordAt property
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm

    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    await user.save()

    // log in the user
    createSendToken(user, 200, res)
})

exports.updatePassword = CatchAsync(async (req, res, next) => {
    // 1) user from collection
    const user = await User.findById(req.user.id).select('+password')

    // 2) check if the posted password is correct
    if (
        !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
        return next(new AppError('Your current password is wrong', 401))
    }

    // 3) If so , update the password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm

    await user.save()

    // 4) Log user in, send JWT
    createSendToken(user, 200, res)
})
