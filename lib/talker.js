var nconf   = require('nconf'),
    colors  = require('colors'),
    tls     = require('tls');

// Load configuration file.
nconf.file({file: 'config.json'});

/*
 * talker
 * Acts as a client for TalkerApp
 */
var talker = {
  conf: {
    host: nconf.get('host') || 'talkerapp.com',
    port: nconf.get('port') || 8500,
    token: nconf.get('token'),
    rooms: nconf.get('rooms')
  },
  room: {}
};

talker.log = function() {
  Array.prototype.unshift.call(arguments, new Date().toTimeString().substr(0, 8).grey);
  return console.log.apply(this, arguments);
};

talker.connect = function (rooms, token) {
  var r;
  rooms = rooms || talker.conf.rooms;
  token = token || talker.conf.token;

  rooms.forEach(function (room) {
    r = new Room(room.name, room.id, token); 
    talker.room[room.name] = r;
    r.connect();
  });

};

talker.message = function (room, content) {
  var request = {
    type: 'message',
    content: content
  };

  talker.room[room].write(request);
  talker.room[room].log('<'.blue, request.content);
};


/*
 * Room
 * Maintains a connection to a TalkerApp room
 */
var Room = function (name, id, token) {
  this.name = name;
  this.id = id;
  this.token = token;
  this.cleartextStream = null;
  this.pingIntervalId = null;
};

Room.prototype.write = function (data) {
  return this.cleartextStream.write(JSON.stringify(data));
};

Room.prototype.log = function () {
  Array.prototype.unshift.call(arguments, '#'.red + this.name.red);
  return talker.log.apply(this, arguments);
};

Room.prototype.messageLog = function (buffer) {
  var data = JSON.parse(buffer.toString());

  switch (data.type) {
    case 'connected':
      this.log('Authorized as', data.user.name + ' (' + data.user.email + ')');
      break;
    case 'join':
      this.log(data.user.name.grey, 'has entered the room'.grey);
      break;
    case 'leave':
      this.log(data.user.name.grey, 'has left the room'.grey);
      break;
    case 'users':
      this.log('Who\'s here:', data.users.map(function (user) { return user.name; }).join(', '));
      break;
    case 'message':
      this.log(data.action ? (data.user.name + ' ' + data.content).grey : data.user.name.green + ': ' + data.content);
      break;
    case 'error':
      this.log(data.message.red);
      break;
    case 'back':
    case 'idle':
      // Do nothing
      break;
    default:
      this.log('Unknown message:', data);
  }
};

Room.prototype.connect = function () {
  var self = this;

  this.cleartextStream = tls.connect(talker.conf.port, talker.conf.host, function () {
    self.log('Connected to ' + talker.conf.host + ':' + talker.conf.port);

    // Setup
    this.setEncoding('utf8');
    this.on('data', self.messageLog.bind(self));

    // Send room connection request
    var request = {
      type: 'connect',
      room: self.id,
      token: self.token
    };

    self.write(request);

    // Set ping interval to keep the connection alive.
    // Has to send this at a minimum interval of 30s.
    self.pingIntervalId = setInterval(function () {
      self.write({type: 'ping'});
    }, 14000);
  });

  return this.cleartextStream;
};

// Export public talker methods.
['connect', 'log', 'message'].forEach(function (method) {
  exports[method] = talker[method];
});
