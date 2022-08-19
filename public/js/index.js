import { login, logout } from './login'
import { bookTour } from './stripe'
import { updateSettings } from './updateSettings'

const form = document.querySelector('.form--login')
const logoutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')
const bookBtn = document.getElementById('book-tour')

if (form) {
    form.addEventListener('submit', (event) => {
        event.preventDefault()

        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        login(email, password)
    })
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout)
}

if (userDataForm) {
    userDataForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = new FormData()
        form.append('name', document.getElementById('name').value)
        form.append('email', document.getElementById('email').value)
        form.append('photo', document.getElementById('photo').files[0])
        console.log(form)
        await updateSettings(form, 'data')
    })
}

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault()

        document.querySelector('.btn--save-password').textContent =
            'Updating...'

        const passwordCurrent =
            document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm =
            document.getElementById('password-confirm').value

        await updateSettings(
            { passwordCurrent, password, passwordConfirm },
            'password'
        )

        document.querySelector('.btn--save-password').textContent =
            'Save password'
    })
}

if (bookBtn) {
    bookBtn.addEventListener('click', (event) => {
        console.log('hello')
        event.target.textContent = 'Processing...'
        console.log(event.target.dataset)
        const { tourId, userId, tourPrice } = event.target.dataset
        bookTour(tourId, userId, tourPrice)
    })
}
