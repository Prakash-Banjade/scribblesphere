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
    public_id: {
      type: String,
      default: 'Profile'
    },
    url: {
      type: String,
      default: null
    }
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
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  connections: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        default: 'not-connected' // not-connected | connected | pending
      }
    }
  ],
  refreshToken: String,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
