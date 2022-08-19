const express = require('express')

const Booking = require('../models/bookingModel')
const factoryFunction = require('../controllers/handlerFactory')
const bookingController = require('../controllers/bookingController')
const authController = require('../controllers/authController')

const router = express.Router()

router.use(authController.protect)

router.get('/checkout-session/:tourID', bookingController.getCheckoutSession)

router.use(authController.restrictTo('admin', 'lead-guide'))

router
    .route('/')
    .get(factoryFunction.getAll(Booking))
    .post(factoryFunction.createOne(Booking))
router
    .route('/:id')
    .get(factoryFunction.getOne(Booking))
    .patch(factoryFunction.updateOne(Booking))
    .delete(factoryFunction.deleteOne(Booking))

module.exports = router
