const nodemailer = require('nodemailer')
const CatchAsync = require('./CatchAsync')
const htmlToText = require('html-to-text')
const pug = require('pug')
// new Email(user, url).sendWelcome()
class Email {
    constructor(user, url) {
        this.to = user.email
        this.firstName = user.name.split(' ')[0]
        this.url = url
        this.from = `Prashant Sehgal${process.env.EMAIL_FROM}`
    }

    newTransport() {
        if (process.env.NODE_ENV.trim() === 'production') {
            // sendgrid
            return 1
        } else if (process.env.NODE_ENV.trim() === 'development') {
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            })
        }
    }

    async send(template, subject) {
        // Render HTML based on pug template
        const html = pug.renderFile(
            `${__dirname}/../views/email/${template}.pug`,
            {
                firstName: this.firstName,
                url: this.url,
                subject,
            }
        )

        // 2 define mail options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html),
        }
        // 3 Creat a transport
        await this.newTransport().sendMail(mailOptions)
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family')
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'Your password reset token (valid for only 10 minutes)'
        )
    }
}

// const sendEmail = CatchAsync(async (options) => {
//     // 1) Creat a transporter
//     // 2) Define email options
//     const emailOptions = {
//         from: 'Prashant <prashant@natours.com>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message,
//     }

//     // 3) Actually send the email
//     await transporter.sendMail(emailOptions)
// })

module.exports = Email
