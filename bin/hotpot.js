#!/usr/bin/env node

'use strict'

const cwd = process.cwd()
const fs = require('fs')
const path = require('path')
const browserify = require('browserify')
const watchify = require('watchify')
const uglify = require('uglifyify')
const stringify = require('stringify')
const globify = require('require-globify')
const livereload = require('../server')
const minimist = require('minimist')

let argv = minimist(process.argv.slice(2))
switch (argv._[0]) {
  case 'help':
    help()
    break
  case 'watch':
    startBundle()
    break
  case 'build-js':
    buildJs()
    break
  case 'build-specs':
    buildSpecs()
    break
  case 'copy-hook':
    copyHook()
    break
  case 'server':
    require('./server/static')()
    break
  default:
    throw new Error('oh no! option not recognized, try hotpot help to get a list of commands')
    break
}

function help () {
  let helper = 'Available commands \n' +
               'watch \n' +
               '  Will run the server in livereload mode \n' +
               'build-js \n' +
               '  Will build the minified js  \n' +
               'build-specs \n' +
               '  Will build the specs  \n' +
               'copy-hook \n' +
               '  Will copy the build hook in your hook folder  \n' +
               'server \n' +
               '  Will run the static server  \n'
  console.log(helper)
}

function loadSpecs() {
  let source = path.join(cwd, '/src/index.specs.js')
  try {
    fs.statSync(source)
  } catch (e) {
    throw new Error('Oh no! there is no source file, please create "src/index.specs.js"')
  }
  return source
}

function loadSource() {
  let view = path.join(cwd, '/src/index.pug')
  let scss = path.join(cwd, '/src/scss/index.scss')
  let source = path.join(cwd, '/src/index.js')
  try {
    fs.statSync(source)
  } catch (e) {
    throw new Error('Oh no! there is no source file, please create "src/index.js"')
  }
  try {
    fs.statSync(view)
  } catch (e) {
    throw new Error('Oh no! there is no view file, please create "src/index.pug"')
  }
  try {
    fs.statSync(scss)
  } catch (e) {
    throw new Error('Oh no! there is sass style file, please create "src/scss/index.scss"')
  }
  return source
}

function copyHook() {
  let source = path.join(cwd, '/hooks/build.js')
  try {
    fs.statSync(source)
  } catch (e) {
    throw new Error('Oh no! there is no hooks build file, please create "hooks/build.js"')
  }
  let hook = fs.readFileSync('./hooks/build.js', 'utf-8')
  fs.writeFileSync(source, hook, 'utf8');
}

function buildSpecs() {
  // build-specs: browserify -t stringify -t require-globify ./src/index.specs.js -d > ./www/js/index.specs.js
  let source = loadSpecs()
  let outfile = path.join(cwd, '/www/js/index.specs.js')
  let b = browserify({
    entries: [source],
    cache: {},
    packageCache: {},
    debug: true
  })
  b.transform(stringify)
  b.transform(globify)
  b.bundle().pipe(fs.createWriteStream(outfile))
}

function startBundle () {
  // watchify -t stringify -t require-globify -p [ ./server ] -d ./src/index.js -o ./www/js/index.bundle.js
  let source = loadSource()
  let outfile = path.join(cwd, '/www/js/index.bundle.js')
  let b = browserify({
    entries: [source],
    cache: {},
    packageCache: {},
    plugin: [watchify],
    debug: true
  })
  b.transform(stringify)
  b.transform(globify)
  b.plugin(livereload, {outfile: outfile})
}

function buildJs () {
  // build-js: browserify -t stringify -t require-globify ./src/index.js | uglifyjs > ./www/js/index.min.js
  let source = loadSource()
  let outfile = path.join(cwd, '/www/js/index.min.js')
  let b = browserify({
    entries: [source],
    cache: {},
    packageCache: {}
  })
  b.transform(stringify)
  b.transform(globify)
  b.transform(uglify)
  b.bundle().pipe(fs.createWriteStream(outfile))
}
