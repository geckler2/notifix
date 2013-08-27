var ltx = require('ltx');

exports.create = function(list) {
  var opml = new ltx.Element('opml', {'version': '1.0'}).
    c('head').c('title').t('Subscriptions').up().up().up().
    c('body')
  list.forEach(function(f) {
    opml.c('outline', {'xmlUrl': f}).up()
  });
  return opml.root().toString();
}
