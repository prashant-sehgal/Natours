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

const port = process.env.PORT

const server = app.listen(port, () => {
    console.log(`App is running on port ${port}...`)
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
