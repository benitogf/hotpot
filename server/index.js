'use strict'

const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const cwd = process.cwd()
const server = require('http').createServer(app)
const Log = require('../lib/log')
const getConfig = require('../lib/config')
const utils = require('../lib/utils')
const replace = require('replacestream')
const compression = require('compression')
const io = require('socket.io')(server)

function initServer(conf, log) {
  app.set('view engine', 'pug')
  app.engine('pug', require('pug').renderFile)
  app.use(compression({ threshold: 0 }))

  let platform = cwd + '/platforms/browser/www/'
  let dir = {
    cordova: platform + 'cordova.js',
    plugins: platform + 'plugins',
    cordovaPlugins: platform + 'cordova_plugins.js',
    js: cwd + '/www/js',
    scss: cwd + '/src/scss',
    img: cwd + '/www/img',
    video: cwd + '/www/video',
    nodeModules: cwd + '/node_modules',
    test: cwd + '/test'
  }

  app.use('/scss', require('./sass')({
    root: dir.scss,
    sourceMap: true,
    sourceComments: true,
    log: log,
    io: io
  }))
  app.use('/cordova.js', express.static(dir.cordova))
  app.use('/cordova_plugins.js', express.static(dir.cordovaPlugins))
  app.use('/plugins', express.static(dir.plugins))
  app.use('/js', express.static(dir.js))
  app.use('/img', express.static(dir.img))
  app.use('/video', express.static(dir.video))
  app.use('/node_modules', express.static(dir.nodeModules))
  app.get('/*', function (req, res) {
    if (conf.target === 'riot') {
      conf.tags = utils.listTags()
    }
    res.render(cwd + '/src/index.pug', conf, function (err, html) {
      if (err) {
        log.warn(err)
        res.status(err.status).end()
      } else {
        res.send(html)
        log.info(req)
      }
    })
  })
}

function BrowserifyLivereload() {
  let b = this
  let outfile = arguments[0]
  let conf = arguments[1]
  let firstBundle = true
  let afterError = false
  let log = Log(conf.title)
  initServer(conf, log)
  let reload = function (err) {
    let file = false
    let line = false
    let column = false
    let livestream = fs.createWriteStream(cwd + '/www/js/livereload.js')
    let outstream = fs.createReadStream(path.join(__dirname, 'livereload.js'))
    outstream = outstream
      .pipe(replace(/PORT/g, conf.port))
      .pipe(replace(/HOST/g, conf.host))
      .pipe(replace(/ERROR/g, (!!err)))
    if (err) {
      log.warn(err)
      file = (err.filename) ? JSON.stringify(err.filename) : JSON.stringify(err.message)
      line = (err.loc) ? JSON.stringify(err.loc.line) : false
      column = (err.loc) ? JSON.stringify(err.loc.column) : false
    }
    outstream.pipe(replace(/FILE/g, file))
      .pipe(replace(/LINE/g, line))
      .pipe(replace(/COLUMN/g, column))
      .pipe(livestream)

    livestream.on('finish', () => {
      if (!firstBundle) {
        io.emit('bundle', afterError)
      } else {
        firstBundle = false
        require('opn')('http://' + conf.host + ':' + conf.port)
      }
    })
  }
  let bundle = function () {
    b.bundle().pipe(fs.createWriteStream(outfile))
  }
  b.on('update', bundle)
  b.on('bundle', function (stream) {
    stream.on('error', function (err) {
      reload(err)
    })
    stream.on('end', function () {
      reload(null)
    })
  })
  bundle()

  server.listen(conf.port)
  // log.info(conf)
  log.info('server [' + conf.environment + '] ready on port ' + conf.port)
}

module.exports = function (b, options) {
  if (b && options && (b.argv || options.outfile)) {
    let outfile = options.outfile || b.argv.outfile
    let StartBundle = BrowserifyLivereload.bind(b, outfile)
    getConfig(StartBundle)
  } else {
    let err = { err: 'no outfile detected' }
    throw err
  }
}
