var express = require('express');
var path = require('path');
var index = require('./routes/index');
var users = {};

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

var server = require('http').createServer(app);
server.listen(app.get('port'), function() {
  console.log('Express server is listening on port ' + app.get('port'));
});

var io = require('socket.io')(server);
io.on('connection', function(socket) {
  socket.on('new user', function(username, callback) {
    if (users[username]) {
      callback(false);
    } else {
      callback(true);
      socket.username = username;
      users[username] = true;
      io.emit('usernames list', Object.keys(users));
    }
  });

  socket.on('send message', function(message) {
    io.emit('new message', { message: message, username: socket.username });
  });

  socket.on('disconnect', function() {
    if (socket.username) {
      delete users[socket.username];
      io.emit('usernames list', Object.keys(users));
    }
  });
});
