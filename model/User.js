const mongoose = require("mongoose");
const Schema = mongoose.Schema;


// creating mongoose schema

const connectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    default: 'pending' // connected | pending
  },

}, { timestamps: true });

const singleMessageSchema = new mongoose.Schema({
  self: {
    type: Boolean,
    required: true,
  },
  text: {
    type: String,
    required: true,
  }
}, { timestamps: true })


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
  connections: [connectionSchema],
  sentRequest: [connectionSchema],
  conversations: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      seen: {
        type: Boolean,
        default: false,
      },
      messages: [singleMessageSchema],
      latestMessage: {
        self: Boolean,
        text: String,
        createdAt: {
          type: Date,
          default: Date.now(),
        }
      },
    }
  ],
  refreshToken: String,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
