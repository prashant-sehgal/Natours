const Tour = require('../models/tourModel')
const User = require('../models/userModel')
const Booking = require('../models/bookingModel')
const CatchAsync = require('../utils/CatchAsync')
const AppError = require('../utils/AppError')

exports.getOverview = CatchAsync(async (req, res, next) => {
    // 1) get all tour data from collections
    const tours = await Tour.find()

    // 2 ) build template

    // 3 render that template using data from 1
    res.status(200).render('overview', {
        title: 'All Tours',
        tours,
    })
})

exports.getTour = CatchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user',
    })

    if (!tour) {
        return next(new AppError('There is no tour with that name', 404))
    }

    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour,
    })
})

exports.getLoginForm = CatchAsync(async (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account',
    })
})

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your Account',
    })
}

exports.updateUserData = CatchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true,
            runValidator: true,
        }
    )
    res.status(200).render('account', {
        title: 'Your Account',
        user: updatedUser,
    })
})

exports.getMyTours = CatchAsync(async (req, res, next) => {
    // 1 Find out booking
    const bookings = await Booking.find({ user: req.user.id })

    // 2 Find tours with the current id
    const tourIDs = bookings.map((el) => el.tour.id)
    const tours = await Tour.find({ _id: { $in: tourIDs } })

    res.status(200).render('overview', {
        title: 'My Tours',
        tours,
    })
})
