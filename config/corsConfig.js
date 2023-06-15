const cors = require("cors");

const frontEndUrl = process.env.FRONTEND_URL;

const corsOptions = {
  origin: (origin, callback) => {
    if (origin === frontEndUrl || !origin) {
      callback(null, true);
    } else {
      callback(new Error(`${origin} blocked by CORS policy`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions)