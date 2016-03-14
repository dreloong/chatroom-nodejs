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
      users[username] = socket;
      io.emit('usernames list', Object.keys(users));
    }
  });

  socket.on('send message', function(message, callback) {
    message = message.trimLeft();
    if (message.substring(0, 3) === '/w ') {
      message = message.substring(3).trimLeft();
      var index = message.indexOf(' ');
      if (index !== -1) {
        var receiver = message.substring(0, index);
        if (users[receiver]) {
          message = message.substring(index + 1);
          [users[receiver], socket].forEach(function(s) {
            s.emit('new message', {
              message: message,
              sender: socket.username,
              receiver: receiver,
              type: 'private'
            });
          });
          callback(true, null);
        } else {
          callback(false, 'Error: User not found.');
        }
      } else {
        callback(false, 'Error: Please add a message.');
      }
    } else {
      io.emit('new message', {
        message: message,
        sender: socket.username,
        type: 'public'
      });
      callback(true, null);
    }
  });

  socket.on('disconnect', function() {
    if (socket.username) {
      delete users[socket.username];
      io.emit('usernames list', Object.keys(users));
    }
  });
});
