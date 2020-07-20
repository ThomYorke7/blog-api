var express = require('express');
var router = express.Router();
const Post = require('../models/post');
const Comment = require('../models/comment');
const mongoose = require('mongoose');
const passport = require('passport');
const { check, validationResult } = require('express-validator');
const moment = require('moment');
const { Html5Entities } = require('html-entities');

// Get all posts
router.get('/', (req, res, next) => {
  Post.find()
    .then((posts) => res.status(200).json(posts))
    .catch((err) => {
      console.log(err);
      return next(err);
    });
});

// Get single post
router.get('/:slug', (req, res, next) => {
  Post.findOne({ slug: req.params.slug })
    .then((post) => {
      if (!post) {
        res.json({ message: "The post doesn't exist" });
        return;
      }
      const entities = new Html5Entities();
      const decodedTitle = entities.decode(post.title);
      const decodedText = entities.decode(post.text);
      res.status(200).json({ post, decodedText, decodedTitle });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });
});

// Create New Post
router.post(
  '/create',
  // Passport Authentication and Input Validation
  passport.authenticate('jwt', { session: false }),
  [
    check('title', 'Title is required').isLength({ min: 1 }).trim().escape(),
    check('text', 'Content is required').isLength({ min: 1 }).trim().escape(),
  ],
  (req, res, next) => {
    const { title, text } = req.body;
    console.log(text);
    const errors = validationResult(req);

    // Check for Errors in Input
    if (!errors.isEmpty()) {
      res.status(400).json(errors.errors);
      return;
    }

    // Create new post and save in DB
    const newPost = new Post({
      title,
      text,
      timestamp: moment().format('MMMM Do[,] YYYY'),
    });

    console.log(newPost);

    newPost
      .save()
      .then((post) => res.json(post))
      .catch((err) => {
        console.log(err);
        return next(err);
      });
  }
);

// Update a post
router.patch(
  '/edit/:slug',
  passport.authenticate('jwt', { session: false }),
  [
    check('title', 'Title is required').isLength({ min: 1 }).trim().escape(),
    check('text', 'Content is required').isLength({ min: 1 }).trim().escape(),
  ],
  (req, res, next) => {
    const { title, text } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors.errors);
    }

    const updatedPost = {
      title,
      text,
      lastUpdate: moment().format('MMMM Do[,] YYYY'),
    };

    Post.findOneAndUpdate({ slug: req.params.slug }, updatedPost, {
      new: true,
    })
      .then((updated) => {
        console.log(updatedPost);
        res.status(200).json({ message: 'Post updated', updated });
      })
      .catch((err) => {
        console.log(err);
        return next(err);
      });
  }
);

// Delete a post
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    Post.findByIdAndDelete(req.params.id)
      .then((post) => {
        if (!post) {
          res.json({ message: "The post doesn't exist" });
          return;
        }
        // Remove all comments of the deleted post
        Comment.remove({
          post: { $in: req.params.id },
        }).then((comment) => console.log(comment));
        res.status(200).json({ message: 'Post deleted' });
      })
      .catch((err) => {
        console.log(err);
        return next(err);
      });
  }
);

// COMMENTS SECTION //

// Get comments for a single post
router.get('/:id/comments', (req, res, next) => {
  Comment.find({ post: req.params.id })
    .then((comments) => {
      res.status(200).json(comments);
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
});

// Create comments for a single post
router.post(
  '/:id/comments',
  [
    check('username').trim().escape(),
    check('text').isLength({ min: 1, max: 200 }).trim().escape(),
  ],
  (req, res, next) => {
    const { username, text } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json(errors.errors);
    }

    const newComment = new Comment({
      username,
      text,
      timestamp: moment().format('DD-MM-YYYY [at] HH:mm'),
      post: req.params.id,
    });

    newComment
      .save()
      .then((comment) => {
        res.status(200).json({ message: 'Comment posted', comment });
      })
      .catch((err) => {
        console.log(err);
        next(err);
      });
  }
);

// Delete a comment if authenticated
router.delete(
  '/:id/comments/:commentId',
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    Comment.findByIdAndDelete(req.params.commentId)
      .then((comment) => {
        if (!comment) {
          res.json({ message: "The comment doesn't exist" });
          return;
        }
        res.status(200).json({ message: 'Comment deleted' });
      })
      .catch((err) => {
        console.log(err);
        return next(err);
      });
  }
);

module.exports = router;
