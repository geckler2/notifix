var irc = require("irc");
var util = require('util');
var eventEmitter = require('events').EventEmitter;
var commands = require('./commands.js');

var Irc = function Irc(conf) {
  var that = this;
  eventEmitter.call(this);
  that.irc = new irc.Client(conf.server, conf.botName, { channels: conf.channels});

  that.irc.addListener("message", function(from, to, text, message) {
    commands(from, text, that, function(to, message) {
      that.irc.say(to, message)
    });
  });
}
util.inherits(Irc, eventEmitter);

Irc.prototype.send = function send(to, message) {
  this.irc.say(to, message)
}

module.exports = Irc;
