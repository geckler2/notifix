# Notifix

Notifix is a RSS -> IM bot powered by Superfeedr. It's 'push' in a way that the content of the feeds is pushed straight to your IM client.

Currently, both XMPP and IRC are supported.
There is a community server runing at http://notifix.ouvre-boite.com but you should run your own to avoid limitations, ads and all kinds of other problems. See below for instructions.

## Deploying

Notifix is stateless (no datastore required!) and is really just/mosty a proxy between IM protocols and Superfeedr.

This means that you can extremely easily deploy it on all kinds of PAAS platform like Nodejitsu, Azure or Heroku, under their free tier (if they provide one!).

Before deploying, you need to configure the bot.

1. Copy `conf.js.tmpl` into `conf.js`
2. the xmpp section is the configuration for the XMPP interface (component.
  * One you have configured your XMPP server with a new bot, enter the jid, server host, port to which the bot will connect and password.
3. the irc section is the configuration for the IRC interface. Configure the irc server, the name of your bot, its password (you'll need to register the bot's handler with the irc server) as well as the rooms in which bot will connect.

## TODO

* Web interface
  * OPML Import/Export
  * SubToMe support
* Show failures when fetching feeds to allow for unsub
* Include ads/default subscriptions for monetization
* Limit number of feeds per subscriber on default setup to 3 per user?
* npm install notifix
* Support &bang
* Support Hipchat

