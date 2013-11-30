  /* Export Command */
module.exports = function(commander) {
  commander.register('export', function(from, args, caller, response) {
    return caller.emit('export', from, function(error, exportURL) {
      if(error || !exportURL) {
        response(from, 'We could not export your feeds');
      }
      else {
        response(from, ['Get your feeds from', exportURL, 'but beware that this url will destroy in 30 seconds'].join(' '));
      }
    });
  }, 'Export your subscriptions as an OPML file from the website');
}
