const mongoose = require('mongoose');


const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
  }
);

const artileSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comments: [commentSchema],
    tags: [String]
  },
  {
    timestamps: true
  }
);

artileSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

const Article = mongoose.model('Article', artileSchema);

module.exports = Article;
