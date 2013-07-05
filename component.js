var xmpp = require('node-xmpp');
var util = require('util');
var eventEmitter = require('events').EventEmitter;

var SUPERFEEDR =  'firehoser.superfeedr.com';

function Component(conf) {
  var that = this;
  eventEmitter.call(this);
  this.notifix = new xmpp.Component(conf);
  this.iqStack = {};

  this.notifix.on('online', function() {
    that.emit('ready');
  });

  this.notifix.on('stanza', function(stanza) {
    if (stanza.is('message') && stanza.attrs.type !== 'error') {
      that.parseMessage(stanza, function(response) {
        that.notifix.connection.send(response);
      });
    }
    else if(stanza.is('iq') && stanza.attrs.type !== 'error') {
      that.parseIq(stanza, function(response) {
        // Do anything. Maybe not.
      });
    }
    else if(stanza.is('presence') && stanza.attrs.type === 'subscribe') {
      var me = stanza.attrs.to;
      stanza.attrs.to = stanza.attrs.from;
      stanza.attrs.from = 'notifix.ouvre-boite.com';
      stanza.attrs.type = 'subscribed';
      that.notifix.connection.send(stanza);
    }
    else if(stanza.is('presence') && stanza.attrs.type === 'probe') {
      var me = stanza.attrs.to;
      var stanza = new xmpp.Element('presence', { from: me, to: stanza.attrs.from}).root();
      that.notifix.connection.send(stanza);
    }
  });

  this.notifix.on('error', function(e) {
    console.error(e);
  });
}
util.inherits(Component, eventEmitter);

Component.prototype.parseMessage = function parseMessage(stanza, cb) {
  var that = this;
  var body = stanza.getChild('body');
  var event = stanza.getChild('event', 'http://jabber.org/protocol/pubsub#event');
  if(body && body.getText()) {
    var parsed = body.getText().match(/\/(subscribe|unsubscribe|list|help)(.*)?/);
    if(parsed && ['subscribe', 'unsubscribe', 'help', 'list'].indexOf(parsed[1]) >= 0) {
      switch (parsed[1]){
        case 'subscribe':
        if(!parsed[2] || !parsed[2].trim()) {
          return that.send(stanza.attrs.from, 'You need to provide a feed url');
        }
        return that.emit('subscribe', parsed[2].trim(), new xmpp.JID(stanza.attrs.from).bare(), function(error, feed) {
          if(error || !feed) {
            that.send(stanza.attrs.from, 'We could not subscribe you to ' + parsed[2].trim());
          }
          else {
            that.send(stanza.attrs.from, 'You were successfully subscribed to ' + feed.url);
          }
        });
        break;
        case 'unsubscribe':
        if(!parsed[2] || !parsed[2].trim()) {
          return that.send(stanza.attrs.from, 'You need to provide a feed url');
        }
        return that.emit('unsubscribe', parsed[2].trim(), new xmpp.JID(stanza.attrs.from).bare(), function(error, feed) {
          if(error || !feed) {
            that.send(stanza.attrs.from, 'We could not unsubscribe you from ' + parsed[2].trim());
          }
          else {
            that.send(stanza.attrs.from, 'You were successfully unsubscribed to ' + feed.url);
          }
        });
        break;
        case 'list':
        return that.emit('list', new xmpp.JID(stanza.attrs.from).bare(), parseInt(parsed[2]), function(error, list) {
          if(error || !list) {
            that.send(stanza.attrs.from, 'We could not list your subscriptions');
          }
          else {
            if(list.length == 0) {
              that.send(stanza.attrs.from, 'You are not subscribed to any feed at this point.');
            }
            else {
              that.send(stanza.attrs.from, 'Here is the list of you subscriptions: \n' + list.join('\n'));
            }
          }
        });
        break;
        case 'help':
        return that.send(stanza.attrs.from, 'This is a simple RSS to IM client. The following commands are valid:\n\
  /susbcribe <feed url> : subscribes to a new feed. You\'ll get the next entries.\n\
  /unsubscribe <feed url> : subscribes to a new feed. You won\'t get any more entries from it.\n\
  /list : shows the list of feeds to which you\'re subscribed.\n\
  /help : shows this message.');
        break;
        default : statement;
      }
    }
    return that.send(stanza.attrs.from, 'Please type /help');
  }
  else if(event && stanza.attrs.from === SUPERFEEDR) {
    var subscriber = decodeURIComponent(stanza.attrs.to.split("@")[0]);
    var status = event.getChild('status', 'http://superfeedr.com/xmpp-pubsub-ext');
    var feedTitle = status.getChild('title').text();
    var items = event.getChild('items');
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
          return that.send(subscriber, [[feedTitle, entryTitle].join(': '), link].join('\n'));
        }
      }
  }
}

Component.prototype.send = function send(to, message) {
  if(typeof(message) == 'string') {
    this.notifix.connection.send(new xmpp.Element('message', {to: to}).c('body').t(message).root());
  }
}

Component.prototype.parseIq = function parseIq(stanza, cb) {
  var that = this;
  if(stanza.id && this.iqStack[stanza.id]) {
    if(this.iqStack[stanza.id].subscribe) {
      switch(stanza.type){
        case 'result':
          var subscription = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub').getChild('subscription');
          this.iqStack[stanza.id].subscribe(null, {url: subscription.attrs.node, title: '', status: ''});
          break;
        case 'error':
          this.iqStack[stanza.id].subscribe({}, null);
          break;
        default:
         /* WAT? */
      }
    }
    else if ( this.iqStack[stanza.id].unsubscribe) {

    }
    else if ( this.iqStack[stanza.id].list) {
      switch(stanza.type){
        case 'result':
          var subscriptions = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub').getChild('subscriptions').getChildren('subscription');
          var feeds = [];
          subscriptions.forEach(function(subscription) {
            feeds.push(subscription.attrs.node);
          });
          this.iqStack[stanza.id].list(null, feeds.sort());
          break;
        case 'error':
          this.iqStack[stanza.id].list({}, null);
          break;
        default:
         /* WAT? */
      }
    }
    delete this.iqStack[stanza.id];
  }
}

Component.prototype.subscribe = function subscribe(feed, from, cb) {
  var id = Math.random().toString(36).substring(7);
  var jid = [encodeURIComponent(from.bare()), this.notifix.connection.jid.bare()].join("@");
  var stanza = new xmpp.Element('iq', {to: SUPERFEEDR, type:'set', id: id, from: this.notifix.connection.jid.toString()}).
  c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'}).
  c('subscribe', {node: feed, jid: jid}).root();
  this.iqStack[id] = {subscribe: cb};
  this.notifix.connection.send(stanza);
}

Component.prototype.list = function subscribe(from, page, cb) {
  var id = Math.random().toString(36).substring(7);
  var jid = [encodeURIComponent(from.bare()), this.notifix.connection.jid.bare()].join("@");
  var stanza = new xmpp.Element('iq', {to: SUPERFEEDR, type:'get', id: id, from: this.notifix.connection.jid.toString()}).
  c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'}).
  c('subscriptions', {'xmlns:superfeedr': 'http://superfeedr.com/xmpp-pubsub-ext', jid: jid, 'superfeedr:page': page}).root();
  this.iqStack[id] = {list: cb};
  console.log(stanza.toString())
  this.notifix.connection.send(stanza);
}



module.exports = Component;