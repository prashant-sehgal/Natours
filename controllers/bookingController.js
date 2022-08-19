const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const Tour = require('../models/tourModel')
const Booking = require('../models/bookingModel')
const CatchAsync = require('../utils/CatchAsync')
const AppError = require('../utils/AppError')

exports.getCheckoutSession = CatchAsync(async (req, res, next) => {
    // 1 get the currenty booked tour
    const tour = await Tour.findById(req.params.tourID)

    // 2) Creat checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${
            req.params.tourID
        }&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourID,
        line_items: [
            // {
            //     name: `${tour.name} Tour`,
            //     description: tour.summary,
            //     images: [
            //         `https://www.natours.dev/img/tours/${tour.imageCover}`,
            //     ],
            //     amount: tour.price * 100,
            //     currency: 'usd',
            //     quantity: 1,
            // },
            {
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [
                            `https://www.natours.dev/img/tours/${tour.imageCover}`,
                        ],
                    },
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
    })

    // 3 creat session as response
    res.status(200).json({
        status: 'success',
        session,
    })
})

exports.createBookingCheckout = CatchAsync(async (req, res, next) => {
    const { tour, user, price } = req.query
    if (!tour || !user || !price) return next()

    await Booking.create({
        tour,
        user,
        price,
    })
    next()
    // res.redirect(`${req.originalUrl.split('?')[0]}`)
    res.redirect(`/`)
})
