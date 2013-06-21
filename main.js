var xmpp = require('node-xmpp');

var r = new xmpp.Router(process.env.PORT);
r.register('notifix.superfeedr.com', function(stanza) {
    console.log("<< "+stanza.toString());
    if (stanza.attrs.type !== 'error') {
  var me = stanza.attrs.to;
  stanza.attrs.to = stanza.attrs.from;
  stanza.attrs.from = me;
  r.send(stanza);
    }
});
// So, where do we point this to?
