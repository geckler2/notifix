function command(from, body, caller, response) {
  var args = body.match(/\+(subscribe|unsubscribe|list|help)(.*)?/);
  if(args) {
    switch (args[1]){
      case 'subscribe':
      if(!args[2] || !args[2].trim()) {
        return response(from, 'You need to provide a feed url');
      }
      return caller.emit('subscribe', args[2].trim(), from, function(error, feed) {
        if(error || !feed) {
          response(from, 'We could not subscribe you to ' + args[2].trim());
        }
        else {
          response(from, 'You were successfully subscribed to ' + feed.url);
        }
      });
      break;
      case 'unsubscribe':
      if(!args[2] || !args[2].trim()) {
        return response(from, 'You need to provide a feed url');
      }
      return caller.emit('unsubscribe', args[2].trim(), from, function(error, feed) {
        if(error || !feed) {
          response(from, 'We could not unsubscribe you from ' + args[2].trim());
        }
        else {
          response(from, 'You were successfully unsubscribed to ' + feed.url);
        }
      });
      break;
      case 'list':
      return caller.emit('list', from, parseInt(args[2]), function(error, list) {
        if(error || !list) {
          response(from, 'We could not list your subscriptions');
        }
        else {
          if(list.length == 0) {
            response(from, 'You are not subscribed to any feed at this point.');
          }
          else {
            response(from, 'Here is the list of you subscriptions: \n' + list.join('\n'));
          }
        }
      });
      break;
      case 'help':
      return response(from, 'This is a simple RSS to IM client. The following commands are valid:\n\
\t+susbcribe <feed url> : subscribes to a new feed. You\'ll get the next entries.\n\
\t+unsubscribe <feed url> : subscribes to a new feed. You won\'t get any more entries from it.\n\
\t+list : shows the list of feeds to which you\'re subscribed.\n\
\t+help : shows this message.');
      break;
      default :
      return response(from, 'Please type +help');
    }
  }
  else {
    return response(from, 'Please type +help');
  }
}

module.exports = command;
