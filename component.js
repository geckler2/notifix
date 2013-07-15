var xmpp = require('node-xmpp');
var util = require('util');
var eventEmitter = require('events').EventEmitter;
var Commander = require('./commands.js');
var SUPERFEEDR =  'firehoser.superfeedr.com';

var commander = new Commander();

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
    commander.run(new xmpp.JID(stanza.from).bare(), body.getText(), that, function(to, message) {
      that.send(to, message)
    }, true);
  }
  else if(event && stanza.attrs.from === SUPERFEEDR) {
    var subscriber = decodeURIComponent(stanza.attrs.to.split("@")[0]);
    that.emit('notification', subscriber, event);
  }
}

Component.prototype.send = function send(to, notification) {
  commander.notify(notification).forEach(function(message) {
    this.notifix.connection.send(new xmpp.Element('message', {to: to}).c('body').t(message).root());
  });
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
      switch(stanza.type){
        case 'result':
          this.iqStack[stanza.id].unsubscribe(null, {});
          break;
        case 'error':
          this.iqStack[stanza.id].subscribe({}, null);
          break;
        default:
         /* WAT? */
      }

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
  var jid = [encodeURIComponent(from), this.notifix.connection.jid.bare()].join("@");
  var stanza = new xmpp.Element('iq', {to: SUPERFEEDR, type:'set', id: id, from: this.notifix.connection.jid.toString()}).
  c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'}).
  c('subscribe', {node: feed, jid: jid}).root();
  this.iqStack[id] = {subscribe: cb};
  this.notifix.connection.send(stanza);
}

Component.prototype.unsubscribe = function unsubscribe(feed, from, cb) {
  var id = Math.random().toString(36).substring(7);
  var jid = [encodeURIComponent(from), this.notifix.connection.jid.bare()].join("@");
  var stanza = new xmpp.Element('iq', {to: SUPERFEEDR, type:'set', id: id, from: this.notifix.connection.jid.toString()}).
  c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'}).
  c('unsubscribe', {node: feed, jid: jid}).root();
  this.iqStack[id] = {unsubscribe: cb};
  this.notifix.connection.send(stanza);
}

Component.prototype.list = function subscribe(from, page, cb) {
  var id = Math.random().toString(36).substring(7);
  var jid = [encodeURIComponent(from), this.notifix.connection.jid.bare()].join("@");
  var stanza = new xmpp.Element('iq', {to: SUPERFEEDR, type:'get', id: id, from: this.notifix.connection.jid.toString()}).
  c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'}).
  c('subscriptions', {'xmlns:superfeedr': 'http://superfeedr.com/xmpp-pubsub-ext', jid: jid, 'superfeedr:page': page}).root();
  this.iqStack[id] = {list: cb};
  this.notifix.connection.send(stanza);
}

module.exports = Component;
