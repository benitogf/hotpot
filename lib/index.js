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
const Log = require('../lib/log')
const chalk = require('chalk')
const title = chalk.white.bgBlack.bold('hot')+chalk.red('pot')
const log = Log(title)

function help () {
  let helper = `
  Available commands:
    watch

      Will run the server in livereload mode

    build-js

      Will build the minified js

    build-specs

      Will build the specs

    copy-hook

      Will copy the build hook in your hook folder

    server

      Will run the static server
  `
  log.info(helper)
}

function loadSpecs(test) {
  let source = (test) ? test : path.join(cwd, '/src/index.specs.js')
  try {
    fs.statSync(source)
  } catch (e) {
    log.warn('Oh no! there is no source file, please create "src/index.specs.js"')
    throw new Error('No specs source found')
  }
  return source
}

function loadSource(test) {
  let view = (test) ? test.view : path.join(cwd, '/src/index.pug')
  let scss = (test) ? test.scss : path.join(cwd, '/src/scss/index.scss')
  let source = (test) ? test.src : path.join(cwd, '/src/index.js')
  try {
    fs.statSync(source)
  } catch (e) {
    log.warn('Oh no! there is no source file, please create "src/index.js"')
    throw new Error('No js source file found')
  }
  try {
    fs.statSync(view)
  } catch (e) {
    log.warn('Oh no! there is no view file, please create "src/index.pug"')
    throw new Error('No .pug file found')
  }
  try {
    fs.statSync(scss)
  } catch (e) {
    log.warn('Oh no! there is sass style file, please create "src/scss/index.scss"')
    throw new Error('No .scss file found')
  }
  return source
}

function copyHook(test) {
  let source = (test) ? test : path.join(cwd, '/hooks/build.js')
  try {
    fs.statSync(source)
  } catch (e) {
    log.warn('Oh no! there is no hooks build file, please create "hooks/build.js"')
    throw new Error('No hook file found')
  }
  let hook = fs.readFileSync('./client/hooks/build.js', 'utf-8')
  fs.writeFileSync(source, hook, 'utf8');
}

function buildSpecs(test) {
  // build-specs: browserify -t stringify -t require-globify ./src/index.specs.js -d > ./www/js/index.specs.js
  let source = (test) ? test.in : loadSpecs()
  let outfile = (test) ? test.out : path.join(cwd, '/www/js/index.specs.js')
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

function startBundle (test) {
  // watchify -t stringify -t require-globify -p [ ./server ] -d ./src/index.js -o ./www/js/index.bundle.js
  let source = (test) ? test.in : loadSource()
  let outfile = (test) ? test.out : path.join(cwd, '/www/js/index.bundle.js')
  log.reset()
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

function buildJs (test) {
  // build-js: browserify -t stringify -t require-globify ./src/index.js | uglifyjs > ./www/js/index.min.js
  let source = (test) ? test.in : loadSource()
  let outfile = (test) ? test.out : path.join(cwd, '/www/js/index.min.js')
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

module.exports = {
  help,
  copyHook,
  buildSpecs,
  startBundle,
  buildJs
}
