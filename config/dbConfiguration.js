const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI;

const ConnectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (e) {
    console.error(e);
  }
};

module.exports = ConnectDB;