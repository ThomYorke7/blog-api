var express = require('express');
var router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

/* GET users listing. */
router.get('/login', function (req, res, next) {
  res.json({ Message: 'Login' });
});

router.post('/login', function (req, res, next) {
  const { username, password } = req.body;

  User.findOne({ username }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    bcrypt.compare(password, user.password, (err, success) => {
      if (err) {
        return next(err);
      }
      if (success) {
        const token = jwt.sign(user.toJSON(), process.env.ACCESS_TOKEN, {
          expiresIn: 3600,
        });
        return res.status(200).json({
          message: 'User authenticated',
          username: user.username,
          token,
        });
      } else {
        return res.status(401).json({ message: 'Incorrect Password' });
      }
    });
  });
});

router.post('/signup', function (req, res, next) {
  const { username, password } = req.body;
  // Create Admin User
  const newUser = new User({
    username,
    password,
  });
  // Encrypt Password
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      newUser.password = hash;
      // Save Password and User in DB
      newUser
        .save()
        .then((user) => {
          console.log('User generated');
          res.redirect('/');
        })
        .catch((err) => console.log(err));
    });
  });
});

module.exports = router;
