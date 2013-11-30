var feender = require('feender');
/*Subscribe command*/
module.exports = function(commander) {
  commander.register('subscribe', function(from, args, caller, response) {
    if(!args[0]) {
      return response(from, 'You need to provide a feed url');
    }

    feender(args[0], function(error, feeds) {
      if(feeds.length === 0) {
        return response(from, 'You need to provide a feed url, ' + args[0] + ' does not point to any.');
      }
      else if(feeds.length > 1) {
        var r = args[0] + ' points to several feeds, please pick the one you want to subscribe to\n';
        feeds.forEach(function(f) {
          r += ' * ' + f.href + ' (' + f.title+ ')\n';
        })
        return response(from, r);
      }
      else {
        return caller.emit('subscribe', feeds[0].href, from, function(error, feed) {
          if(error || !feed) {
            response(from, 'We could not subscribe you to ' + args[0]);
          }
          else {
            response(from, 'You were successfully subscribed to ' + feed.url);
          }
        });
      }
    });
  }, '<feed url> : Subscribes to a new feed. You\'ll get the next entries.');
}
