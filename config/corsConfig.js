const cors = require("cors");

const frontEndUrl = [
  'https://scribblesphere.vercel.app',
  'http://localhost:3000',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (frontEndUrl.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error(`${origin} blocked by CORS policy`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions)
