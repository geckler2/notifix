var url = require('url');
var Component = require('./component.js');
var Irc = require('./irc.js');
var conf = require('./conf.js');

var xmpp = new Component(conf.xmpp);
var irc = new Irc(conf.irc);

xmpp.on('subscribe', function(feed, from, cb) {
  xmpp.subscribe(feed, 'xmpp://' + from, cb)
});

irc.on('subscribe', function(feed, from, cb) {
  xmpp.subscribe(feed, 'irc://' + from, cb)
});

xmpp.on('list', function(from, page, cb) {
  xmpp.list('xmpp://' + from, page, cb)
});

irc.on('list', function(from, page, cb) {
  xmpp.list('irc://' + from, page, cb)
});

xmpp.on('unsubscribe', function(feed, from, cb) {
  xmpp.unsubscribe(feed, 'xmpp://' + from, cb)
});

irc.on('unsubscribe', function(feed, from, cb) {
  xmpp.unsubscribe(feed, 'irc://' + from, cb)
});

xmpp.on('notification', function(to, entry) {
  var p = to.split('://');
  console.log(p)
  switch (p[0]){
    case 'xmpp':
      xmpp.send(p[1], entry)
    break;
    case 'irc':
      irc.send(p[1], entry)
    break;
  }
});

