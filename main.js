var Component = require('./component.js');
var conf = require('./conf');

var xmpp = new Component(conf.xmpp);

xmpp.on('subscribe', function(feed, from, cb) {
  xmpp.subscribe(feed, from, cb)
});

xmpp.on('list', function(from, page, cb) {
  xmpp.list(from, page, cb)
});

xmpp.on('unsubscribe', function(feed, from, cb) {
  xmpp.unsubscribe(feed, from, cb)
});

xmpp.on('notification', function(to, entry) {
  xmpp.notify(to, entry)
});
