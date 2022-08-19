const dotenv = require('dotenv')
dotenv.config({ path: `${__dirname}/config.env` })

const mongoose = require('mongoose')
const app = require('./app')

process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception 💥 Shutting down')
    console.log(err.name, err.message)
    console.error(err)
    process.exit(1)
})

mongoose.connect(process.env.DATABASE_STRING).then(() => {
    console.log('DB connection successfull')
})

const server = app.listen(process.env.PORT || 5000, () => {
    console.log(`App is running on port ${process.env.PORT || 5000}...`)
})

process.on('unhandledRejection', (err) => {
    // console.log(err.name, err.message)
    // console.log(err)
    console.error(err)
    console.log('Unhandled Rejection 💥 Shutting down')
    server.close(() => {
        process.exit(1)
    })
})

process.on('SIGTERM', () => {
    console.log('Signterm recieved')
    server.close(() => {
        console.log('💥 Sigterm Process Terminated')
    })
})
