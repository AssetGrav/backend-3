const express = require('express')
const Quality = require("../models/Qualities");
const router = express.Router({mergeParams: true})

router.get('/', async (req, res) => {
    try {
        const list = await Quality.find()
        res.status(200).send(list)
    } catch (e) {
        res.status(500).json({
            message: 'на сервере произошла ошибкаю Попробуйте позже'
        })
    }
} )

module.exports = router