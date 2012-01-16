var fs = require('fs'),
    talker = require('./lib/talker');

// Output Walker Texas Ranger ASCII.
console.log(fs.readFileSync('./lib/chucknorris_ascii.txt', 'utf8').grey);

// Connect to TalkerApp.
talker.connect();
// Load all plugins specified in config file.
talker.plugins.loadAll();
