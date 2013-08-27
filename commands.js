var feender = require('feender');
var Bitly = require('bitly');
var conf = require('./conf.js');


var bitly;
if(conf.bitly) {
  bitly = new Bitly(conf.bitly.username, conf.bitly.apiKey);
}

function shorten(url, cb) {
  if(bitly) {
    bitly.shorten(url, function(err, response) {
      if (err) throw err;
      cb(response.data.url)
    });
  }
  else {
    cb(url);
  }
}

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

  /*Unsubscribe command*/
  this.register('unsubscribe', function(from, args, caller, response) {
    var feed = args[0];
    if(args[0] === "last") {
      feed = null;
      if(caller.last)
        feed = caller.last.feed;
    }

    console.log(feed)
    if(!feed) {
      return response(from, 'You need to provide a feed url, or the keyword "last" if you want to unsubscribe from the latest notification.');
    }

    return caller.emit('unsubscribe', feed, from, function(error, f) {
      console.log(feed)
      if(error || !feed) {
        response(from, 'We could not unsubscribe you from ' + feed);
      }
      else {
        response(from, 'You were successfully unsubscribed to ' + feed);
      }
    });
  }, '<feed url> : Unsubscribes from a feed. You won\'t get any more entries from it.');

  /* List command */
  this.register('list', function(from, args, caller, response) {
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

  /*Track command*/
  this.register('track', function(from, args, caller, response) {
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

/* formats the message for a notification, yields the various messages. That's important. */
Commander.prototype.notify = function notify(notif, cb) {
  var n = {};
  var status = notif.getChild('status', 'http://superfeedr.com/xmpp-pubsub-ext');
  n.feed = status.attrs['feed'];
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
          if(l.attrs.type === 'text/html' && (l.attrs.rel === 'alternate' || l.attrs.rel === 'canonical')) {
            link = l.attrs.href;
          }
        });
        shorten(link, function(shortLink) {
          cb([[feedTitle, entryTitle].join(': '), shortLink].join('\n'), n);
        });
      }
    }
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
      var arguments = [];
      if(args[2])
        arguments = args[2].trim().split(' ');
      this.commands[args[1]](from, arguments, caller, response);
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
