function Commander() {
  this.commands = {};
  this.helps = [];
  var that = this;

  /* Help command*/
  this.register('help', function(from, args, caller, response) {
    var message = 'I am an RSS to IM client (xmpp or irc). The following commands are valid:\n';
    that.helps.forEach(function(help) {
      message += '\t\n' + help;
    })
    return response(from, message);
  }, 'Shows this message.');

  /*Subscribe command*/
  this.register('subscribe', function(from, args, caller, response) {
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
  }, '<feed url> : Subscribes to a new feed. You\'ll get the next entries.');

  /*Unsubscribe command*/
  this.register('unsubscribe', function(from, args, caller, response) {
    if(!args[2] || !args[2].trim()) {
      return response(from, 'You need to provide a feed url');
    }
    return caller.emit('unsubscribe', args[2].trim(), from, function(error, feed) {
      if(error || !feed) {
        response(from, 'We could not unsubscribe you from ' + args[2].trim());
      }
      else {
        response(from, 'You were successfully unsubscribed to ' + args[2].trim());
      }
    });
  }, '<feed url> : Unsubscribes from a feed. You won\'t get any more entries from it.');

  /* List command */
  this.register('list', function(from, args, caller, response) {
    return caller.emit('list', from, parseInt(args[2]), function(error, list) {
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

/* formats the message for a notification, yields the various messages. That's important. */
Commander.prototype.notify = function notify(notif) {
  var messages = [];
  var status = notif.getChild('status', 'http://superfeedr.com/xmpp-pubsub-ext');
  var feedTitle = status.getChild('title').text();
  var items = notif.getChild('items');
  if(items) {
    var item = items.getChild('item');
    if(item) {
      var entry = item.getChild('entry', 'http://www.w3.org/2005/Atom');
      if(entry) {
        var title = entry.getChild('title');
        if(title) {
          var entryTitle = title.text();
        }
        var link = null;
        entry.getChildren('link').forEach(function(l) {
          if(!link) {
            link = l.attrs.href
          }
          else if(l.rel === 'alternate' && l.type === 'text/html') {
            link = l.attrs.href;
          }
        });
        messages.push([[feedTitle, entryTitle].join(': '), link].join('\n'));
      }
    }
    return messages;
  }
  else {
    console.log('No items. This was likely an error feed. We need to tell the subscriber so that he unsusbcribes!')
  }
}

Commander.prototype.register = function register(name, command, help) {
  this.commands[name] = command;
  this.helps.push('+' + name + ' ' + help);
}

Commander.prototype.run = function run(from, body, caller, response, showHelp) {
  var args = body.match(/\+(\w+)(.*)?/);
  if(args) {
    if(this.commands[args[1]]) {
      this.commands[args[1]](from, args, caller, response);
    }
    else {
      if(showHelp) {
        return response(from, 'Please type +help');
      }
    }
  }
  else {
    if(showHelp) {
      return response(from, 'Please type +help');
    }
  }
}


module.exports = Commander;
