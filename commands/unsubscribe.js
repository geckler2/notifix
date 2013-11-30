/*Unsubscribe command*/
module.exports = function(commander) {
  commander.register('unsubscribe', function(from, args, caller, response) {
    var feed = args[0];
    if(args[0] === "last") {
      feed = null;
      if(caller.last)
        feed = caller.last.feed;
    }

    if(!feed) {
      return response(from, 'You need to provide a feed url, or the keyword "last" if you want to unsubscribe from the latest notification.');
    }

    return caller.emit('unsubscribe', feed, from, function(error, f) {
      if(error || !feed) {
        response(from, 'We could not unsubscribe you from ' + feed);
      }
      else {
        response(from, 'You were successfully unsubscribed to ' + feed);
      }
    });
  }, '<feed url> : Unsubscribes from a feed. You won\'t get any more entries from it.');
}
