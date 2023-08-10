const cors = require("cors");

const frontEndUrl = [
  'http://localhost:5173',
  'https://scribblesphere.vercel.app',
];

const corsOptions = {
  origin: '*',
  // credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions)