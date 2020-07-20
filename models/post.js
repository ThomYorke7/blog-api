const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slugify = require('slugify');
const marked = require('marked');
const createDomPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const dompurify = createDomPurify(new JSDOM().window);

const PostSchema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
  lastUpdate: { type: String },
  image: String,
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  slug: { type: String, required: true, unique: true },
});

PostSchema.pre('validate', function (next) {
  if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  next();
});

module.exports = mongoose.model('Post', PostSchema);
