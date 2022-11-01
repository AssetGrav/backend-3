const express = require('express')
const User = require('../models/User')
const auth = require('../middleware/auth.middleware')
const router = express.Router({mergeParams: true})

router.patch('/:userId', auth, async(req, res) => {
    try {
        const { userId } = req.params
        // todo: userId === current user id
        if (userId === req.user._id) {
            const updateUser = await User.findByIdAndUpdate(userId, req.body, {new: true})
            res.send(updateUser)
        } else {
            res.status(401).json({message: 'Unautorized'})
        }
    } catch (e) {
        res.status(500).json({
            message: 'на сервере произошла ошибкаю Попробуйте позже'
        })
    }
})

router.get('/', auth, async (req, res) => {
    try {
        const list = await User.find()
        res.send(list)
    } catch (e) {
        res.status(500).json({
            message: 'на сервере произошла ошибкаю Попробуйте позже'
        })
    }
})

module.exports = router