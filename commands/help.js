/* Help command*/
module.exports = function(commander) {
  commander.register('help', function(from, args, caller, response) {
    var message = 'I am an RSS to IM client (xmpp or irc). The following commands are valid:\n';
    commander.helps.forEach(function(help) {
      message += '\t\n' + help;
    })
    return response(from, message);
  }, 'Shows this message.');
}


