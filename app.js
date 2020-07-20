require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var helmet = require('helmet');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('./models/user');

//Routers
var postsRouter = require('./routes/posts');
var adminRouter = require('./routes/admin');

const port = process.env.PORT || 5000;

var app = express();

// Passport Setup
passport.use(
  new JwtStrategy(
    {
      secretOrKey: process.env.ACCESS_TOKEN,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    function (payload, done) {
      User.findOne({ username: payload.username }, (err, user) => {
        if (err) return done(err);
        if (!user) {
          return done(null, false, { message: 'Username was not found' });
        } else {
          return done(null, user);
        }
      });
    }
  )
);

// Mongoose Setup
const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});
const connection = mongoose.connection;
connection.on('error', (error) => {
  console.error(error);
});
connection.once('open', () => {
  console.log('Connected to Database');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(helmet());
app.use(passport.initialize());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/posts', postsRouter);
app.use('/api/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// if (process.env.NODE_ENV === 'production') {
//   app.get(/^((?!(api)).)*$/, (req, res) => {
//     res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
//   });
// }

// App launch
app.listen(port, () => {
  console.log(`Server up and running on port ${port}`);
});

module.exports = app;
