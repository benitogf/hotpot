#!/usr/bin/env node

'use strict'

const pug = require('pug')
const fs = require('fs')
const getConfig = require('../server/config')
const sass = require('node-sass-evergreen')
const exec = require('child_process').exec

function buildSass (conf, Q) {
  var deferral = Q.defer()
  sass.render({
    file: 'src/scss/index.scss'
  }, function (err, result) {
    if (err) {
      throw err
    }
    fs.writeFile('www/css/index.css', result.css, function (err) {
      if (err) {
        throw err
      }
      console.log('css')
      deferral.resolve()
    })
  })
  return deferral.promise
}

function buildPug (conf, Q) {
  var deferral = Q.defer()
  var render = pug.compileFile('src/index.pug')
  var html = render(conf)
  fs.writeFile('www/index.html', html, function (err) {
    if (err) {
      throw err
    }
    console.log('html')
    deferral.resolve()
  })
  return deferral.promise
}

function buildJs (Q) {
  var deferral = Q.defer()
  var child = exec('npm run buildjs')
  child.on('close', function () {
    console.log('js')
    deferral.resolve()
  })
  return deferral.promise
}

module.exports = function (context) {
  var Q = context.requireCordovaModule('q')
  var platform = context.opts.platforms[0]
  if (context.opts.options.config === 'nw') {
    platform = 'nw'
  }
  console.log('starting pre build for ' + platform + ' platform')
  var deferral = Q.defer()
  getConfig(function (conf) {
    conf.environment = platform
    switch (platform) {
      case 'android':
        conf.base = 'file:///android_asset/www/'
        conf.preUrl = 'index.html#'
        conf.html5Mode = 'false'
        break
      case 'browser':
        conf.preUrl = ''
        conf.html5Mode = 'true'
        break
      case 'nw':
        conf.preUrl = 'index.html#'
        conf.html5Mode = 'false'
        break
    }
    Q.all([
      buildPug(conf, Q),
      buildSass(conf, Q),
      buildJs(Q)
    ]).then(function () {
      console.log('pre build done')
      deferral.resolve()
    })
  })
  return deferral.promise
}
