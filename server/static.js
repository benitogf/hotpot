'use strict'

const express = require('express')
const app = express()
const server = require('http').createServer(app)
const bole = require('bole')
const bistre = require('bistre')({ time: true })
const cwd = process.cwd()
const getConfig = require('../lib/config')
const compression = require('compression')

function initServer (conf) {
  app.use(compression({ threshold: 0 }))
  const log = configLog(conf.title)
  app.use(function (req, res, next) {
    log.info(req)
    next()
  })

  const platform = cwd + '/platforms/browser/www/'
  const dir = {
    cordova: platform + 'cordova.js',
    plugins: platform + 'plugins',
    cordovaplugins: platform + 'cordova_plugins.js',
    js: platform + 'js',
    css: platform + 'css',
    img: platform + 'img',
    video: platform + 'video',
    html: platform + 'index.html'
  }
  app.use('/cordova.js', express.static(dir.cordova))
  app.use('/cordova_plugins.js', express.static(dir.cordovaplugins))
  app.use('/plugins', express.static(dir.plugins))
  app.use('/js', express.static(dir.js))
  app.use('/css', express.static(dir.css))
  app.use('/img', express.static(dir.img))
  app.use('/video', express.static(dir.video))
  app.use('/*', function (req, res) {
    res.sendFile(dir.html)
  })
  server.listen(conf.port)
  log.info('server [' + conf.environment + '] ready on port ' + conf.port)
}

function configLog (name) {
  const log = bole(name)
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

module.exports = function () {
  getConfig(initServer, 'server')
}
