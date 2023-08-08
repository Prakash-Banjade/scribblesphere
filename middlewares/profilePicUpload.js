const multer = require('multer');

const storage = multer.memoryStorage(); // multer.diskspace can be used to store in the server as file

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png'
  ) {
    cb(null, true);
  } else {
    // Reject the file
    cb(new Error('Invalid file type. Only JPEG and PNG files are allowed.'));
  }
};

const profilePicUpload = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } }).single('image');

module.exports = profilePicUpload;
