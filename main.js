var OpmlParser = require('opmlparser');
var url = require('url');
var fs = require('fs');
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

function expireRoute(url, method) {
  setTimeout(function() {
    app.routes[method].forEach(function(r, i) {
      if(r.path === url) {
        app.routes.get.splice(i);
      }
    });
  }, 1000 * 60);
}

function importOPML(from, cb, onSubscription) {
  var route = '/import/' + Math.random().toString(36).substring(7);
  expireRoute(route, 'get');
  expireRoute(route, 'post');

  app.get(route, function(request, response) {
    response.render('import', { title: 'Import OPML' });
  });

  app.post(route, function(request, response) {
    fs.createReadStream(request.files['opml'].path).pipe(new OpmlParser()).
    on('error', function(error) {
      console.log('ERROR', error);
    })
    .on('feed', function (feed) {
      xmpp.subscribe(feed.xmlurl, 'xmpp://' + from, onSubscription);
    })
    .on('end', function () {
      // Done subscribing!
   });
    response.send('200', 'Receied. We ll send you notifications on your IM');
  });
  cb(null, conf.web.root + route);
}

function exportOPML(from, cb) {
  xmpp.listAll(from, function(error, list) {
    var file = opml.create(list);
    var route = '/export/' + Math.random().toString(36).substring(7);
    expireRoute(route, 'get');
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

xmpp.on('import', function(from, cb, onSubscription) {
  importOPML('xmpp://' + from, cb, onSubscription);
});

irc.on('import', function(from, cb, onSubscription) {
  importOPML('irc://' + from, cb, onSubscription);
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

