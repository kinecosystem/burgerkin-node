var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var indexRouter = require('./routes/index')
var usersRouter = require('./routes/users')
const config = require('./config')
const gameEngine = require('./game/gameEngine')
const socketManager = require('./game/socketManager')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', require('./routes/admin'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({error:{message:err.message}});
});

if(config.monitor_tables) {
  setTimeout( () => {
    gameEngine.monitorTables(config.monitor_tables_interval)
  }, 3000);
}

module.exports = app;