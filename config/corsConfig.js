const cors = require("cors");

const frontEndUrl = [
  'http://localhost:5173',
  'https://bucci.netlify.app',
  'https://bucci.vercel.app',
  'my-general-backend.vercel.app'
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