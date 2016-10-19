(function () {
  'use strict'

  var socket = document.createElement('script')
  var script = document.createElement('script')
  socket.setAttribute('src', 'http://HOST:PORT/socket.io/socket.io.js')
  script.type = 'text/javascript'

  socket.onload = function () {
    /* eslint-disable */
    if (ERROR) {
      var error = '<code>' + FILE + '</code>'
      if (LINE) {
        error = '<span>Error processing file:' + error + ' - line: ' + LINE + ' column: ' + COLUMN + '</span>'
      }
      document.write(error)
    }
    /* eslint-disable */
    document.head.appendChild(script)
  }
  script.text = [
    'window.socket = io("http://HOST:PORT");',
    'socket.on("bundle", function() {',
    'console.log("livereaload triggered ")',
    'window.location.reload(ERROR);',
    '});'
  ].join('\n')
  document.head.appendChild(socket)
}())
