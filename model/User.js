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
  profile: {
    name: {
      type: String,
      default: 'Profile'
    },
    data: {
      type: Buffer,
      default: null
    },
    type: {
      type: String,
      default: ''
    },
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
  password: String,
  details: {
    profession: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    socialLinks: [
      {
        network: String,
        link: String,
      },
    ],
    writesOn: [String],
    description: String,
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
