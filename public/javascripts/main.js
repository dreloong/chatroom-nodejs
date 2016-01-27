var socket = io();

var $newMessageText = $('#new-message-text');
var $usernameText= $('#username-text');

$('#send-message-btn').click(function() {
  socket.emit('send message', $newMessageText.val());
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
  var li = '<li class="media"><div class="media-body"><div class="media">'
      + '<div class="pull-left">' + info.username + ': </div>'
      + '<div class="media-body">' + info.message + '<hr /></div>'
      + '</div></div></li>';

  $('#messages-list').append(li);
});

socket.on('usernames list', function(usernames) {
  var html = usernames.map(function(username) {
    return '<li class="media"><div class="media-body">' + username
        + '</div></li>';
  }).join('');

  $('#users-list').html(html);
});
