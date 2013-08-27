var url = require('url');
var Component = require('./component.js');
var Irc = require('./irc.js');
var conf = require('./conf.js');
var app = require('./web.js');

var xmpp = new Component(conf.xmpp);
var irc = new Irc(conf.irc);
var opml = require('./opml.js');

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

function exportOPML(from, cb) {
  xmpp.listAll(from, function(error, list) {
    var file = opml.create(list);
    var route = '/export/' + Math.random().toString(36).substring(7);
    setTimeout(function() {
    app.routes.get.forEach(function(r, i) {
      if(r.path === route) {
        app.routes.get.splice(i);
      }
    });
  }, 1000 * 60);
    app.get(route, function(request, response) {
      response.set('Content-Type', 'application/xml');
      response.send(200, file)
    });
    cb(null, conf.web.root + route);
  });
}

xmpp.on('export', function(from, cb) {
  exportOPML('xmpp://' + from, cb);
});

irc.on('export', function(from, cb) {
  exportOPML('irc://' + from, cb);
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

app.listen(8080);

