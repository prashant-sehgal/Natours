import axios from 'axios'
import Stripe from 'stripe'
import { showAlert } from './alerts'

const stripe = Stripe(
    'pk_test_51LXl5TSBIE6xG8Ea0qyRzRsJm2CmJdJiGP5VB1HE6CzPoONsfTBDuu5cG1pR5InqS8fUkzR2MfuV9evp2xfvXtNk00QCLFJh2F'
)

export const bookTour = async (tourId, userId, tourPrice) => {
    try {
        // 1 get session from api
        const session = await axios(
            `/api/v1/bookings/checkout-session/${tourId}`
        )
        // console.log(session)
        // 2 Create checout form + charge credit card
        // await Stripe.redirectToCheckout({
        //     sessiondId: session.data.session.id,
        // })
        location.assign(`/?tour=${tourId}&user=${userId}&price=${tourPrice}`)
    } catch (err) {
        showAlert('error', err)
    }
}
