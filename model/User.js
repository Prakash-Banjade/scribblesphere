const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// creating mongoose schema
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  roles: {
    User: {
      type: Number,
      default: 2059,
    },
    Editor: Number,
    Admin: Number,
    Accountant: Number,
  },
  password: {
    type: String,
    required: true,
  },
  details: {
    nickname: {
      type: String,
      default: "",
    },
    qualification: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    birth: {
      type: Date,
    },
    socialLinks: [
      {
        network: String,
        link: String,
      },
    ],
    writesOn: [String],
    hobby: String,
  },
  followers: {
    type: Number,
    default: 0,
  },
  following: {
    type: Number,
    default: 0,
  },
  refreshToken: String,
});

module.exports = mongoose.model("User", userSchema);
