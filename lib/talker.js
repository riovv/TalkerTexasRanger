var nconf = require('nconf'),
    colors = require('colors'),
    tls = require('tls');

// Load configuration file.
nconf.file({file: 'config.json'});

var talker = {
    isConnected: false,
    pingId: null
};

talker.log = function() {
    var d = new Date();
    Array.prototype.unshift.call(arguments, (d.toTimeString().substr(0, 8).grey));
    return console.log.apply(this, arguments);
};

talker.ping = function() {
    return talker.write({'type': 'ping'});
};

talker.write = function (data) {
    return talker.cleartextStream.write(JSON.stringify(data));
};

talker.connect = function (room, token) {
    talker.cleartextStream = tls.connect(nconf.get('port'), nconf.get('host'), function () {
        talker.log('Connected to ' + nconf.get('host') + ':' + nconf.get('port'));

        // Setup
        talker.cleartextStream.setEncoding('utf8');
        talker.cleartextStream.on('data', talker.handleResponse);

        // Connect to chat.
        var request = {
            type: 'connect',
            room: room || nconf.get('room'),
            token: token || nconf.get('token')
        };

        talker.write(request);

        // Set ping interval to keep the connection alive.
        talker.pingId = setInterval(talker.ping, 15000);
    });
};

talker.message = function (content) {
    if (!talker.isConnected) return;

    var request = {
        type: 'message',
        content: content
    };
    talker.write(request);
    talker.log('<'.blue, request.content);
};

talker.handleResponse = function(data) {
    var response = JSON.parse(data.toString());

    switch (response.type) {
        case 'back':
        case 'idle':
            // Do nothing
            break;
        case 'connected':
            talker.isConnected = true;
            talker.log('Authorized as', response.user.name + ' (' + response.user.email + ')');
            break;
        case 'join':
            talker.log(response.user.name.grey, 'has entered the room'.grey);
            break;
        case 'users':
            talker.log('Who\'s here:', response.users.map(function (user) { return user.name; }).join(', '));
            break;
        case 'message':
            talker.log(response.user.name, '>'.blue, response.content);
            break;
        case 'error':
            talker.log(response.message.red);
            break;
        default:
            talker.log('Unknown message:', response);
    }
};

// Export public talker methods.
['log', 'connect', 'message'].forEach(function (method) {
    exports[method] = talker[method];
});
