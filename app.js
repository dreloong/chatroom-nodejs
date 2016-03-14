var express = require('express');
var path = require('path');
var index = require('./routes/index');
var MongoClient = require('mongodb').MongoClient;
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

      // emit recent messages
      MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
        var collection = db.collection('messages');
        var cursor = collection.find().sort({ _id: -1 }).limit(10);
        cursor.toArray(function(err, result) {
          result.reverse().forEach(function(info) {
            socket.emit('new message', info);
          });
        });
      });
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
      var info = { message: message, sender: socket.username, type: 'public' };
      // save public message to database
      MongoClient.connect(process.env.MONGOLAB_URI, function (err, db) {
        db.collection('messages').insertOne(info, function (err, result) {
          if (err) { console.warn(err.message); }
        });
      });
      io.emit('new message', info);
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
