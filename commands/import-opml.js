/* Import Command */
module.exports = function(commander) {
  commander.register('import', function(from, args, caller, response) {
    return caller.emit('import', from, function(error, importURL) {
      if(error || !importURL) {
        response(from, 'We could not prepare the import for you');
      }
      else {
        response(from, ['Import your feeds at', importURL, 'but beware that this url will destroy in 30 seconds.'].join(' '));
      }
    }, function(error, feed) {
      if(error || !feed) {
        response(from, 'We could not subscribe you to ' + args[0]);
      }
      else {
        response(from, 'You were successfully subscribed to ' + feed.url);
      }
    });
  }, 'Import an OPML file');
}
