var Bitly = require('bitly');
var conf = require(__dirname + '/../conf.js');

var help = require(__dirname + '/help.js');
var subscribe = require(__dirname + '/subscribe.js');
var unsubscribe = require(__dirname + '/unsubscribe.js');
var list = require(__dirname + '/list.js');
var track = require(__dirname + '/track.js');
var exportOPML = require(__dirname + '/export-opml.js');
var importOPML = require(__dirname + '/import-opml.js');

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
  help(this);
  subscribe(this);
  unsubscribe(this);
  list(this);
  track(this);
  exportOPML(this);
  importOPML(this);
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
    console.log('No items. This was likely an error feed. We need to tell the subscriber so that he unsusbcribes from ' + n.feed);
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
