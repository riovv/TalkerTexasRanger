# TalkerTexasRanger
Is a bot for TalkerApp.com with plugin support.
This is still in **beta** and not stable. 
If you find any bugs please create an issue, or why not contribute with a solution?

## Getting started
### Get and install node.js  
http://nodejs.org/#download

### Install TalkerTexasRanger  
[Download TalkerTexasRanger as a zip file](https://github.com/I-ARE-RIO/TalkerTexasRanger/zipball/master)
or

    git clone git@github.com:I-ARE-RIO/TalkerTexasRanger.git
### Create a config.json file, you can use config.json.example as a starting point.

    {
        "host": "you.talkerapp.com",
        "port": 8500,
        "token": "find this at: http://you.talkerapp.com/settings#api",
        "rooms": [
          { "name": "Main", "id": "9999" },
          { "name": "Slave", "id": "333" }
        ],
        "plugins": [
          "example"
        ],
        "command": "!"
    }
**host:** The hostname to connect to, most likely this is you.talkerapp.com where *you* is the account name.  
**port:** This is most likely the default 8500  
**token:** Token is your personal user key to to authenticate and it can be found at: http://talkerapp.com/settings#api  
**rooms:** A list of rooms that you want the bot to connect to at application start up.  
**plugins:** A list of plugins that gets autoloaded at application start up.  
**command:** The command indicator. All registered commands will be prefixed with this. For example **!**hello

### Run it from your command line using

    node TalkerTexasRanger

## Plugins
Plugins is the core foundation of TalkerTexasRanger without them he would be just a silent observer.  
A plugin is simply a regular node module that hooks into the talker client in different ways.  
TalkerTexasRanger includes several plugins (or atleast aims to) that you can opt in and use if you like.  
However chances are that you want to write your own custom Plugins. So here is how you do it:

### Create myplugin.js inside the **plugins/** directory
*This is actually not a must, but highly recommended. The plugin loader will look first inside plugins/ directory then fallback into looking inside
node_modules/ etc.*

### Get talker client instance
At the very beginning of myplugin.js:

    var talker = require('../lib/talker');
        
### talker.on (event, listener, [rooms])
When the event occurs the listener will be called with a data object containing information about  
the event as its first and only parameter.  
By default the event listener is added to each room, but optionally a list of rooms can be supplied.  
There are several events that your plugin can listen too.  

**connected:** when TalkerTexasRanger connects to a room.  
**join:** when a user enters a room.  
**leave:** when a user leaves a room.  
**users:** when the client receives a "Who's here" message when joining a room.  
**message:** when someone writes a message to a room.  
**failure:** when any error within TalkerApp has occured.  
**idle:** when a users goes idle.  
**back:** when a users comes back from idle.  

    talker.on('connected', function (data) {
        talker.message(data.room, 'Hello world!');
    } 
    
### talker.command (command, callback, [rooms])
Listens for commands prefixed by an command identifier which is specified in config.json.  
Commands can take any number of arguments separated by [space].
This example listens for the message !sum n n n... in all rooms.

    talker.command('sum', function(data, args) {
        var sum = args.reduce(function (a, b) {
            return a + b;
        });
        talker.message(data.room, sum);
    });