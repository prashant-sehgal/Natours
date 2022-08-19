const dotenv = require('dotenv')
dotenv.config({ path: `${__dirname}/../../config.env` })

const mongoose = require('mongoose')
const fs = require('fs')

const Tour = require('../../models/tourModel')
const User = require('../../models/userModel')
const Review = require('../../models/reviewModel')

mongoose
    .connect(process.env.DATABASE_STRING)
    .then(() => console.log('DB connected'))

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
)

const importData = async () => {
    try {
        await Tour.create(tours)
        // await User.create(users, { validateBeforeSave: false })
        await Review.create(reviews)

        console.log('Data imported successfully')
    } catch (err) {
        console.log('💥💥💥💥')
        console.error(err)
    }
    process.exit()
}

const deleteData = async () => {
    try {
        await Tour.deleteMany()
        // await User.deleteMany()
        // await Review.deleteMany()

        console.log('Data deleted successfully')
    } catch (err) {
        console.log('💥💥💥💥')
        console.error(err)
    }
    process.exit()
}

if (process.argv[2] === '--import') importData()
else if (process.argv[2] === '--delete') deleteData()
