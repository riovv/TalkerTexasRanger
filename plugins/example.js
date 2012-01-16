var talker = require('../lib/talker');

talker.on('connected', function (data) {
  talker.message(data.room, 'Hello world!');
});
