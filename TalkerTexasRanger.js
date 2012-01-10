var tls = require('tls'),
    fs = require('fs'),
    talker = require('./lib/talker.js');

// Output Walker Texas Ranger ASCII.
console.log(fs.readFileSync('./lib/chucknorris_ascii.txt', 'utf8').grey);

// Connect to TalkerApp.
talker.connect();
