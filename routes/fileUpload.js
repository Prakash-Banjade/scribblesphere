const router = require('express').Router();
const User = require('../model/User.js');
const verifyJWTs = require('../middlewares/verifyJWTs.js');

router.use(verifyJWTs)
router.post('/', profilePicUpload, async (req, res) => {
    const file = req.file;
    // console.log(req.body)
    if (!file) return res.status(400).json({ message: 'No files served' });

    const userEmail = req.email;
    const foundUser = await User.findOne({ email: userEmail }).exec();
    if (!foundUser) return res.status(401).json({ message: 'Unauthorized' })

    // Set the desired image dimensions and quality
    const width = 200;
    const height = 200;
    const quality = 80; // Set your desired quality (0 to 100)

    // Resize and compress the image using sharp
    const resizedImage = await sharp(file.buffer)
        .resize(width, height, { fit: 'cover' })
        .jpeg({ quality })
        .toBuffer();

    console.log(resizedImage)

    try {
        foundUser.profile.name = file.originalname
        foundUser.profile.data = resizedImage
        foundUser.profile.type = file.mimetype
        await foundUser.save();

        res.json({ message: 'Profile picture added' })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})



module.exports = router;