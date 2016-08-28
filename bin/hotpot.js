#!/usr/bin/env node
/*
  // Goals:
  start: watchify -t stringify -t require-globify -p [ ./server ] -d ./src/index.js -o ./www/js/index.bundle.js
  build-specs: browserify -t stringify -t require-globify ./src/index.specs.js -d > ./www/js/index.specs.js
  build-js: browserify -t stringify -t require-globify ./src/index.js | uglifyjs > ./www/js/index.min.js
  server: node server/static.js
*/

'use strict'

const cwd = process.cwd()
const fs = require('fs')
const path = require('path')
const browserify = require('browserify')
const watchify = require('watchify')
const stringify = require('stringify')
const globify = require('require-globify')
const livereload = require('../server')

function hotpot () {
  let view = path.join(cwd, '/src/index.pug')
  let scss = path.join(cwd, '/src/scss/index.scss')
  let source = path.join(cwd, '/src/index.js')
  try {
    fs.statSync(source)
  } catch (e) {
    throw new Error('Oh no! there is no source file, please create "src/index.js" before runing hotpot')
  }
  try {
    fs.statSync(view)
  } catch (e) {
    throw new Error('Oh no! there is no view file, please create "src/index.pug" before runing hotpot')
  }
  try {
    fs.statSync(scss)
  } catch (e) {
    throw new Error('Oh no! there is sass style file, please create "src/scss/index.scss" before runing hotpot')
  }
  startBundle(source)
}

function startBundle (source) {
  let outfile = path.join(cwd, '/www/js/index.bundle.js')
  var b = browserify({
    entries: [source],
    cache: {},
    packageCache: {},
    plugin: [watchify]
  })
  b.transform(stringify)
  b.transform(globify)
  b.plugin(livereload, {outfile: outfile})
}

hotpot()
