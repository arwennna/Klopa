var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');

var session = require('express-session');
var flash = require('express-flash');

var app = express();

const IME_SESIJE = 'session_id';
const JEDAN_SAT = 1000 * 60 * 60;
const SESSION_SECRET = '53tPHS:8g]]4]p/';

app.use(session({
  name: IME_SESIJE,
  resave: false,
  saveUninitialized: false,
  secret: SESSION_SECRET,
  cookie: {
    maxAge: JEDAN_SAT,
    sameSite: true,
    secure: false,
  }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

var indexRouter = require('./routes/index');
var glavnaRouter = require('./routes/glavna');
var administracijaRouter = require('./routes/administracija');
var createRouter = require('./routes/administracija_create');
var updateRouter = require('./routes/update');
var deleteRouter = require('./routes/delete');
var kupacRouter = require('./routes/kupac');
var superadminRouter = require('./routes/superadmin');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/administracija', administracijaRouter);
app.use('/glavna', glavnaRouter);
app.use('/update', updateRouter);
app.use('/create', createRouter);
app.use('/delete', deleteRouter);
app.use('/kupac', kupacRouter);
app.use('/superadmin', superadminRouter);

app.use( express.static( "public" ) );

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
