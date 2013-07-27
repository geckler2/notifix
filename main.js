var url = require('url');
var express = require('express');
var Component = require('./component.js');
var Irc = require('./irc.js');
var conf = require('./conf.js');

var xmpp = new Component(conf.xmpp);
var irc = new Irc(conf.irc);
var app = express();

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
  switch (p[0]){
    case 'xmpp':
      xmpp.notify(p[1], entry)
    break;
    case 'irc':
      irc.notify(p[1], entry)
    break;
  }
});

app.get('/', function(req, res){
  res.send('Hello World. I can only talk XMPP or IRC at this point. More soon.');
});

app.listen(8080);

