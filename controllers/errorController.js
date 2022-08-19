const AppError = require('../utils/AppError')

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const handleDuplicateFieldDB = (err, res) => {
    const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0]
    const message = `Duplicate field value ${value}/ Please use another value!`
    return new AppError(message, 400)
}

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        })
    }
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message,
    })
}

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message)
    const message = `Invalid input data. ${errors.join('. ')}`

    return new AppError(message, 400)
}

const handleJWTError = (err) =>
    new AppError('Invalid token. Please login again', 401)

const handleJWTExpiredError = (err) =>
    new AppError('Your token has expired. Please login again', 401)

const sendErrorProduction = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            })
        } else {
            return res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!',
            })
        }
    }
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message,
        })
    } else {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: 'Please try again later',
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if (process.env.NODE_ENV.trim() === 'development') {
        sendErrorDev(err, req, res)
    } else if (process.env.NODE_ENV.trim() === 'production') {
        let error = Object.assign(err)

        if (err.name === 'CastError') error = handleCastErrorDB(error)
        if (err.code === 11000) error = handleDuplicateFieldDB(error)
        if (err.name === 'ValidationError')
            error = handleValidationErrorDB(error)
        if (err.name === 'JsonWebTokenError') error = handleJWTError(error)
        if (err.name === 'TokenExpiredError')
            error = handleJWTExpiredError(error)

        sendErrorProduction(error, req, res)
    }
}