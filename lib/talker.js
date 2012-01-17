var nconf   = require('nconf'),
    colors  = require('colors'),
    tls     = require('tls'),
    events  = require('events');

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
    rooms: nconf.get('rooms'),
    plugins: nconf.get('plugins'),
    command: nconf.get('command') || '!'
  },
  plugins: {},
  rooms: {}
};

talker.plugins.load = function (name) {
  var path = '../plugins/' + name;

  // If plugin begins with any of / ./ ../
  // then it should be treated as an absolute path.
  if (/^\.?\.?\/.*/.test(name)) {
    return require(name);
  }

  // First try to load the plugin from plugins/ directory
  // if it can't be found there, try loading it like usual.
  // Plugins should be encouraged to be placed in the plugins/
  // directory, but the fallback is necessary to have.
  try {
    return require(path);
  } catch (e) {
    if (e.message.substr(0, 18) !== 'Cannot find module') throw e;
  }

  return require(name);
};

talker.plugins.loadAll = function () {
  talker.conf.plugins.forEach(function (plugin) {
    talker.plugins.load(plugin);
  });
};

talker.log = function() {
  Array.prototype.unshift.call(arguments, new Date().toTimeString().substr(0, 8).grey);
  return console.log.apply(this, arguments);
};

talker.connect = function (rooms, token) {
  var r;

  // If no rooms or token is explicitly given
  // take the values from config.
  rooms = rooms || talker.conf.rooms;
  token = token || talker.conf.token;

  // Connect to each room.
  rooms.forEach(function (room) {
    r = new Room(room.name, room.id, token); 
    talker.rooms[room.name] = r;
    r.connect();
  });
};

talker.on = function (event, listener, rooms) {
  rooms = rooms || Object.keys(talker.rooms);
  rooms.forEach(function (room) {
    talker.rooms[room].on(event, listener);
  });
};

talker.command = function (command, callback, rooms) {
  rooms = rooms || Object.keys(talker.rooms);

  var listener = function (data) {
    // Look for pattern string !command
    var pattern = '^([' + talker.conf.command.replace(/([\\\-\]])/g, '\\$1') + ']' + command + ')( .*)?$';

    // Match the command an a possible argument
    var matchArray = data.content.match(new RegExp(pattern));

    // If the array is not null, then the command is definitly matched
    if (matchArray !== "undefined" && matchArray != null) {

      // Remove command string 
      var argString = data.content.replace(matchArray[1],"");

      // Remove leading whitespace
      argString =  argString.replace(/^\s*/, '');

      // Split args
      var args = argString.split(" ");

      // Send the original data and args array to the callback
      callback.call(this, data, args);
    
    }
  };

  rooms.forEach(function (room) {
    talker.rooms[room].on('message', listener);
  });
};

talker.message = function (room, content) {
  var request = {
    type: 'message',
    content: content
  };

  talker.rooms[room].write(request);
  talker.rooms[room].log('<'.blue, request.content);
};

talker.broadcast = function (content) {
  var rooms = Object.keys(talker.rooms);

  rooms.forEach(function (room) {
    talker.message(room, content);
  });
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

// Inherits from events.EventEmitter
Room.super_ = events.EventEmitter;
Room.prototype = Object.create(events.EventEmitter.prototype, {
  constructor: {
    value: Room,
    enumerable: false
  }
});

Room.prototype.write = function (data) {
  return this.cleartextStream.write(JSON.stringify(data));
};

Room.prototype.log = function () {
  Array.prototype.unshift.call(arguments, '#'.red + this.name.red);
  return talker.log.apply(this, arguments);
};

Room.prototype.dataHandler = function (buffer) {
  var data = JSON.parse(buffer.toString());
  // Add room to data Object.
  data.room = this.name;

  switch (data.type) {
    case 'connected':
      this.log('Authorized as', data.user.name + ' (' + data.user.email + ')');
      this.emit('connected', data);
      break;
    case 'join':
      this.log(data.user.name.grey, 'has entered the room'.grey);
      this.emit('join', data);
      break;
    case 'leave':
      this.log(data.user.name.grey, 'has left the room'.grey);
      this.emit('leave', data);
      break;
    case 'users':
      this.log('Who\'s here:', data.users.map(function (user) { return user.name; }).join(', '));
      this.emit('users', data);
      break;
    case 'message':
      this.log(data.action ? (data.user.name + ' ' + data.content).grey : data.user.name.green + ': ' + data.content);
      this.emit('message', data);
      break;
    case 'error':
      this.log(data.message.red);
      this.emit('failure', data);
      break;
    case 'back':
      this.emit('back', data);
      break;
    case 'idle':
      this.emit('idle', data);
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
    this.on('data', self.dataHandler.bind(self));

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
['broadcast', 'command', 'connect', 'log', 'message', 'on', 'plugins'].forEach(function (method) {
  exports[method] = talker[method];
});
