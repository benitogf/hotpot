'use strict'

const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const server = require('http').createServer(app)
const bole = require('bole')
const bistre = require('bistre')({ time: true })
const cwd = process.cwd()
const getConfig = require('./config')
const prepend = require('prepend-file')
const concat = require('concat-stream')
const replace = require('replacestream')
const gaze = require('gaze')
const compression = require('compression')
const io = require('socket.io')(server)
const shell = require('shelljs')

function initServer (conf, log) {
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
  let specs = path.join(cwd, '/test/specs.pug')
  let isSpec = false
  try {
    isSpec = fs.statSync(specs)
  } catch (e) {
    log.info('no specs file found, runing hotpot without specs template, create "test/specs.pug" to activate specs')
  }
  if (isSpec) {
    app.use('/test', express.static(dir.test))
    app.get('/specs', function (req, res) {
      conf.specs = listSpecs()
      res.render(cwd + '/test/specs.pug', conf, function (err, html) {
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
  app.get('/*', function (req, res) {
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

function testWatch (log) {
  let testDir = cwd + '/test/specs/*.js'
  gaze(testDir, function (err) {
    if (err) {
      log.warn(err)
    }
    var watcher = this
    watcher.on('all', function (event, filepath) {
      io.emit('bundle')
      if (event === 'added') {
        // not firing
        // https://github.com/shama/gaze/issues/121
        log.info(filepath + ' was ' + event)
      }
    })
  })
}

function listSpecs () {
  let tags = shell.ls(cwd + '/test/specs')
  tags.splice(tags.indexOf('setup.js'), 1)
  tags.splice(tags.indexOf('utils.js'), 1)
  return tags
}

function configLog (name) {
  let log = bole(name)
  bole.output([{
    level: 'info',
    stream: bistre
  },
  {
    level: 'err',
    stream: bistre
  }])
  bole.setFastTime(true)
  bistre.pipe(process.stdout)
  return log
}

function BrowserifyLivereload () {
  let b = this
  let outfile = arguments[0]
  let conf = arguments[1]
  let firstBundle = true
  let log = configLog(conf.title)
  initServer(conf, log)
  testWatch(log)
  b.on('bundle', function (stream) {
    stream.on('end', reload)
    function reload () {
      fs.createReadStream(path.join(__dirname, 'socket.js'))
              .pipe(replace(/PORT/g, conf.port))
              .pipe(replace(/HOST/g, conf.host))
              .pipe(concat(read))

      function read (data) {
        prepend(outfile, data + ';', function (err) {
          if (err) {
            throw err
          }
          if (!firstBundle) {
            io.emit('bundle')
          } else {
            firstBundle = false
            require('opn')('http://' + conf.host + ':' + conf.port)
          }
        })
      }
    }
  })
  b.bundle().pipe(fs.createWriteStream(outfile))

  server.listen(conf.port)
  log.info(conf)
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
