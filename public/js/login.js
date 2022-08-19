import axios from 'axios'

import { showAlert } from './alerts'

export const login = async (email, password) => {
    try {
        // const res = await (
        //     await fetch('http://127.0.0.1:8000/api/v1/users/login', {
        //         method: 'POST',
        //         body: JSON.stringify({
        //             email,
        //             password,
        //         }),
        //         headers: { 'Content-Type': 'application/json' },
        //     })
        // ).json()
        const res = await axios({
            url: 'http://127.0.0.1:8000/api/v1/users/login',
            method: 'POST',
            data: {
                email,
                password,
            },
        })
        window.setTimeout(() => {
            showAlert('success', 'Logged in successfully')
            location.assign('/')
        }, 1500)
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

export const logout = async () => {
    try {
        const res = await axios({
            method: 'get',
            url: 'http://127.0.0.1:8000/api/v1/users/logout',
        })
        if (res.data.status === 'success') location.assign('/')
    } catch (err) {
        showAlert('error', `Error logging out! try again`)
        console.log(err.response)
    }
}
