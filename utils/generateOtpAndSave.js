const User = require('../model/User.js')
const OTP = require('../model/otp.js')

const generateOtpAndSave = async (email, fullname, pwd) => {
    const otpLength = 6;
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < otpLength; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        otp += digits[randomIndex];
    }

    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 5); // expiration time is after 5 minutes of opt sent

    // Save OTP and expiration to the database
    const newOTP = new OTP({
        otp,
        expiration: otpExpiration,
        email,
        fullname, 
        password: pwd,
    });

    await newOTP.save();
    return otp;
}

module.exports = generateOtpAndSave;
