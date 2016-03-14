var socket = io();

var $messageError = $('#message-error');
var $newMessageText = $('#new-message-text');
var $usernameText= $('#username-text');

$('#send-message-btn').click(function() {
  socket.emit('send message', $newMessageText.val(), function(valid, error) {
    if (valid) {
      $messageError.hide();
    } else {
      $messageError.show();
      $messageError.html(error);
    }
  });
  $newMessageText.val('');
});

$('#submit-username-btn').click(function() {
  socket.emit('new user', $usernameText.val(), function(valid) {
    if (valid) {
      $('#username-setup-container').hide();
      $('#chat-room-container').show();
    } else {
      $('#username-error').html('Username already exists. Try another one.');
    }
  });
  $usernameText.val('');
});

socket.on('new message', function(info) {
  var elementClass = info.type === 'private' ? 'media text-info' : 'media';

  var li = '<li class="' + elementClass + '"><div class="media-body">'
      + '<div class="media"><div class="pull-left">' + info.sender
      + (info.receiver ? ' to ' + info.receiver : '')
      + ': </div><div class="media-body">' + info.message
      + '</div></div></div></li>';

  $('#messages-list').append(li);
});

socket.on('usernames list', function(usernames) {
  var html = usernames.map(function(username) {
    return '<li class="media"><div class="media-body">' + username
        + '</div></li>';
  }).join('');

  $('#users-list').html(html);
});
