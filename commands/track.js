/*Track command*/
module.exports = function(commander) {
  commander.register('track', function(from, args, caller, response) {
    if(args.length == 0) {
      return response(from, 'You need to provide at least one keyword to track (4 characters long minimum)');
    }
    var trackFeed = 'http://superfeedr.com/track?include=' + args.map(function(w) { return encodeURIComponent(w)}).join(',');
    return caller.emit('subscribe', trackFeed, from, function(error, feed) {
      if(error || !feed) {
        response(from, 'We could not track ' + args.join("&") + 'for you.');
      }
      else {
        response(from, 'You are now successfully tracking ' + args.join("&"));
      }
    });
  }, '<keywords> : Track any mention of the keywords provided. If multiple keywords are added, only entries matching them all will be notified.');
}
