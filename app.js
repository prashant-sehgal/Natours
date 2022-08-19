const express = require('express')
const morgan = require('morgan')
const path = require('path')
const cookieParser = require('cookie-parser')

const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongooseSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const compression = require('compression')
const cors = require('cors')

const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const viewRouter = require('./routes/viewRoutes')
const bookingRouter = require('./routes/bookingRoutes')
const AppError = require('./utils/AppError')
const globalErrorHandler = require('./controllers/errorController')

const app = express()

app.enable('trust proxy')

// set view engine
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.use(cors())

// Alloweing only certain url to get access to out application
// app.use({
//     origin: 'https://www.natours.com'
// })

// serving static files
app.use(express.static(path.join(__dirname, 'public')))

// global middlewares

// set Security http headers
app.use(helmet())

// Development login
if (process.env.NODE_ENV.trim() === 'development') app.use(morgan('dev'))

// limit request from same ip
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'To many request from this ip, please try again in an hour',
})
app.use('/api', limiter)

// reading data from body into req.body
app.use(
    express.json({
        limit: '10kb',
    })
)

app.use(cookieParser())
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
// Data sanitization against Nosql query injection
app.use(mongooseSanitize())

// Data sanitization against XSS
app.use(xss())

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
)

app.use(compression())

// Text middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString()
    next()
})

// routes
app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404))
})

app.use(globalErrorHandler)

module.exports = app
