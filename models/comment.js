const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  username: { type: String, required: true },
  text: { type: String, required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post' },
  timestamp: { type: String, required: true },
});

module.exports = mongoose.model('Comment', CommentSchema);
