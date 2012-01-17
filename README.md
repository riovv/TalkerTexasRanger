# TalkerTexasRanger
Is a bot for TalkerApp.com with plugin support.
This is still in **beta** and not stable. 
If you find any bugs please create an issue, or why not contribute with a solution?

## Getting started
### Get and install node.js  
http://nodejs.org/#download

### Install TalkerTexasRanger  
https://github.com/I-ARE-RIO/TalkerTexasRanger/zipball/master
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
