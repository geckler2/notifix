/* List command */
module.exports = function(commander) {
  commander.register('list', function(from, args, caller, response) {
    return caller.emit('list', from, parseInt(args[0]), function(error, list) {
      if(error || !list) {
        response(from, 'We could not list your subscriptions');
      }
      else {
        if(list.length == 0) {
          response(from, 'You are not subscribed to any feed at this point.');
        }
        else {
          response(from, 'Here is the list of your subscriptions: \n' + list.join('\n'));
        }
      }
    });
  }, 'Shows the list of feeds to which you\'re subscribed.');
}
