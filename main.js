var xmpp = require('node-xmpp');

var jid = 'notifix.superfeedr.com';

var r = new xmpp.Router(process.env.PORT);
r.loadCredentials(jid, jid + '.key',  jid + '.crt');

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


// SRV _xmpp-client._tcp.notifix.superfeedr.com  60    10 5222 69.164.222.83
// SRV _xmpp-server._tcp.notifix.superfeedr.com  60    10 5269 69.164.222.83
// SRV _jabber._tcp.notifix.superfeedr.com 600   10 5269 69.164.222.83
