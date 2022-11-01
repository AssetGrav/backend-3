const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { generateUserData } = require("../utils/helpers")
const TokenService = require("../services/token.service")
const {check, validationResult} = require("express-validator");
const router = express.Router({mergeParams: true})

// /api/auth/signUp
// 1. get data from req (email, password ...)
// 2. check if users already exists
// 3. hash password
// 4. create user
// 5. generate tokens
router.post('/signUp', async (req, res) => {
    try {
        const { email, password } = req.body
        const exitingUser = await User.findOne({ email })
        if (exitingUser) {
            return res.status(400).json({
                error: {
                    message: 'EMAIL_EXISTS',
                    code: 400
                }
            })
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        const newUser = User.create( {
            ...generateUserData(),
            ...req.body,
            password: hashedPassword
        })

        const tokens = TokenService.generate({ _id: newUser._id })
        await TokenService.save(newUser._id, tokens.refreshToken)

        res.status(201).send({ ...tokens, userId: newUser._id })

    } catch (e) {
        res.status(500).json({
            message: 'на сервере произошла ошибкаю Попробуйте позже'
        })
    }
})

// 1. validate
// 2. find user
// 3. compare hashed password
// 4. generate token
// 5. return data
router.post('/signInWithPassword', [
    check('email', 'Email не корректный'). normalizeEmail().isEmail(),
    check('password', 'Пароль не может быть пустым').exists(),
    async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: {
                    message: 'INVALID_DATA',
                    code: 400
                }
            })
        }

        const { email, password } = req.body

        const existingUser = await User.findOne({ email })
        if (!existingUser) {
            return res.status(400).send({
                error: {
                    message: 'EMAIL_EXIST',
                    code: 400
                }
            })
        }

        const isPasswordEqual = await bcrypt.compare(password, existingUser.password)

        if (!isPasswordEqual) {
            return res.status(400).send({
                error: {
                    message: 'INVALID_PASSWORD',
                    code: 400
                }
            })
        }

        const tokens = TokenService.generate({ _id: existingUser._id })
        await TokenService.save(existingUser._id, tokens.refreshToken)

        res.status(200).send({ ...tokens, userId: existingUser._id })
    } catch (e) {
        res.status(500).json({
            message: 'на сервере произошла ошибкаю Попробуйте позже'
        })
    }
}])

function isTokenInvalid(data, dbToken) {
    return !data || !dbToken || data._id !== dbToken?.user?.toString()
}

router.post('/token', async (req, res) => {
    try {
        const { refresh_token: refreshToken } = req.body
        const data = TokenService.validateRefresh(refreshToken)
        const dbToken = await TokenService.findToken(refreshToken)

        if (isTokenInvalid(data, dbToken)) {
            return res.status(401).json({message: 'Unauthorized'})
        }

        const tokens = await TokenService.generate({
            _id: data._id
        })

        await TokenService.save(data._id, tokens.refreshToken)

        res.status(200).send({ ...tokens, userId: data._id })
    } catch (e) {
        res.status(500).json({
            message: 'на сервере произошла ошибкаю Попробуйте позже'
        })
    }
})

module.exports = router