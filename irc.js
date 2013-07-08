var irc = require("irc");
var util = require('util');
var eventEmitter = require('events').EventEmitter;
var Commander = require('./commands.js');

var commander = new Commander();

commander.register('join', function(from, args, caller, response) {
  caller.irc.join(args[2].trim());
}, '<room> : Joins the room.');

var Irc = function Irc(conf) {
  var that = this;
  eventEmitter.call(this);
  that.irc = new irc.Client(conf.server, conf.botName, { channels: conf.channels});

  that.irc.addListener("error", function(error) {
    console.log('Error', error)
  });

  that.irc.addListener("message", function(from, to, text, message) {
    var showHelp = true;
    if(to.match(/#.*/)) {
      from = to; // Handling of channels.
      showHelp = false;
    }
    commander.run(from, text, that, function(to, message) {
      that.irc.say(to, message)
    }, showHelp);
  });
}
util.inherits(Irc, eventEmitter);

Irc.prototype.send = function send(to, message) {
  this.irc.say(to, message)
}

module.exports = Irc;
