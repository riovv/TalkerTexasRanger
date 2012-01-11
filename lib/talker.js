var nconf = require('nconf'),
    colors = require('colors'),
    tls = require('tls');

// Load configuration file.
nconf.file({file: 'config.json'});

var talker = {
  conf: {
    host: nconf.get('host'),
    port: nconf.get('port') || 8500,
    token: nconf.get('token'),
    room: nconf.get('room') || 'Main'
  },
  pingId: null
};

talker.write = function (data) {
  return talker.cleartextStream.write(JSON.stringify(data));
};

talker.ping = function() {
  return talker.write({'type': 'ping'});
};

talker.handleResponse = function(data) {
  var response = JSON.parse(data.toString());

  switch (response.type) {
    case 'back':
    case 'idle':
      // Do nothing
      break;
    case 'connected':
      talker.log('Authorized as', response.user.name + ' (' + response.user.email + ')');
      break;
    case 'join':
      talker.log(response.user.name.grey, 'has entered the room'.grey);
      break;
    case 'leave':
      talker.log(response.user.name.grey, 'has left the room'.grey);
      break;
    case 'users':
      talker.log('Who\'s here:', response.users.map(function (user) { return user.name; }).join(', '));
      break;
    case 'message':
      talker.log(response.action ? (response.user.name + ' ' + response.content).grey : response.user.name.green + ': ' + response.content);
      break;
    case 'error':
      talker.log(response.message.red);
      break;
    default:
      talker.log('Unknown message:', response);
  }
};

talker.log = function() {
  Array.prototype.unshift.call(arguments, new Date().toTimeString().substr(0, 8).grey);
  return console.log.apply(this, arguments);
};

talker.connect = function (room, token) {
  talker.cleartextStream = tls.connect(talker.conf.port, talker.conf.host, function () {
    talker.log('Connected to ' + talker.conf.host + ':' + talker.conf.port);

    // Setup
    talker.cleartextStream.setEncoding('utf8');
    talker.cleartextStream.on('data', talker.handleResponse);

    // Connect to chat.
    var request = {
      type: 'connect',
      room: room || talker.conf.room,
      token: token || talker.conf.token
    };

    talker.write(request);

    // Set ping interval to keep the connection alive.
    // Has to send this at a minimum interval of 30s.
    talker.pingId = setInterval(talker.ping, 15000);
  });

  return talker;
};

talker.message = function (content) {
  var request = {
    type: 'message',
    content: content
  };
  talker.write(request);
  talker.log('<'.blue, request.content);
};

// Export public talker methods.
['log', 'connect', 'message'].forEach(function (method) {
  exports[method] = talker[method];
});
