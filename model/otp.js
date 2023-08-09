const mongoose = require('mongoose')

const otpSchema = mongoose.Schema({
    otp: {
        type: Number,
        required: true,
    },
    expiration: {
        type: Date,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    fullname: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true, })

module.exports = mongoose.model('Otp', otpSchema)