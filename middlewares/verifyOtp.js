const OTP = require('../model/otp.js')

const verifyOtp = async (req, res, next) => {
    const { email, otp: enteredOTP } = req.body;

    // Find the OTP record for the given email
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 }); // same user can signup and left the otp many times, so check the latest one by sorting

    if (!otpRecord) {
        return res.status(400).json({ message: 'OTP not found or expired', status: 'error' });
    }

    if (Number(otpRecord.otp) !== Number(enteredOTP)) { // check if the server generated otp(otpRecord.otp) is equal to the user entered otp
        return res.status(400).json({ message: 'Invalid OTP', status: 'error' });
    }

    const now = new Date();
    if (now > otpRecord.expiration) { // check if the otp has expired
        return res.status(400).json({ message: 'OTP expired', status: 'error' });
    }

    // otp is valid, user is now verified, so register the user
    req.fullname = otpRecord.fullname;
    req.email = otpRecord.email;
    req.pwd = otpRecord.password

    await OTP.deleteMany({ email });

    next();
}

module.exports = verifyOtp;