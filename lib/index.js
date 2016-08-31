'use strict'

const cwd = process.cwd()
const fs = require('fs')
const path = require('path')
const pug = require('pug')
const sass = require('node-sass-evergreen')
const browserify = require('browserify')
const watchify = require('watchify')
const uglify = require('uglify-js')
const stringify = require('stringify')
const globify = require('require-globify')
const livereload = require('../server')

function help () {
  let helper = `
  Available commands:

  hotpot

    Will run the server in livereload mode

  hotpot help

    Will show the command list

  hotpot build-js

    Will build the minified js

  hotpot build-specs

    Will build the specs

  hotpot copy-hook

    Will copy a build cordova hook
  `
  console.log(helper)
}

function loadSpecs (source) {
  if (!source) {
    source = path.join(cwd, '/src/index.specs.js')
  }
  try {
    fs.statSync(source)
  } catch (e) {
    console.log('Oh no! there is no specs file, please create "src/index.specs.js"')
    throw new Error('No specs file found')
  }
  return source
}

function loadDir (test) {
  let dir = {
    hook: (test) ? test.hook : path.join(cwd, '/hooks'),
    src: (test) ? test.src : path.join(cwd, '/src'),
    scss: (test) ? test.scss : path.join(cwd, '/src/scss'),
    www: (test) ? test.www : path.join(cwd, '/www'),
    js: (test) ? test.js : path.join(cwd, '/www/js')
  }
  try {
    fs.statSync(dir.src)
  } catch (e) {
    console.log('Oh no! there is no source folder, please create one')
    throw new Error('No source folder found')
  }
  try {
    fs.statSync(dir.scss)
  } catch (e) {
    console.log('Oh no! there is no scss folder, please create one')
    throw new Error('No scss folder found')
  }
  try {
    fs.statSync(dir.www)
  } catch (e) {
    console.log('Oh no! there is no www folder, please create one')
    throw new Error('No www folder found')
  }
  try {
    fs.statSync(dir.js)
  } catch (e) {
    console.log('Oh no! there is no www/js folder, please create one')
    throw new Error('No js folder found')
  }
  return dir
}

function loadSource (dir) {
  if (!dir) {
    dir = loadDir()
  }
  let view = path.join(dir.src, 'index.pug')
  let scss = path.join(dir.scss, 'index.scss')
  let source = path.join(dir.src, 'index.js')
  try {
    fs.statSync(source)
  } catch (e) {
    console.log('Oh no! there is no source file, please create "src/index.js"')
    throw new Error('No js source file found')
  }
  try {
    fs.statSync(view)
  } catch (e) {
    console.log('Oh no! there is no view file, please create "src/index.pug"')
    throw new Error('No index.pug file found')
  }
  try {
    fs.statSync(scss)
  } catch (e) {
    console.log('Oh no! there is sass style file, please create "src/scss/index.scss"')
    throw new Error('No index.scss file found')
  }
  return source
}

function copyHook (source) {
  if (!source) {
    source = path.join(cwd, '/hooks/build.js')
  }
  try {
    fs.statSync(source)
  } catch (e) {
    console.log('Oh no! there is no hooks build file, please create "hooks/build.js"')
    throw new Error('No hook file found')
  }
  let hook = fs.readFileSync('./client/hooks/build.js', 'utf-8')
  fs.writeFileSync(source, hook, 'utf8')
}

function buildSpecs (test) {
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

function buildSass (conf, Q) {
  var defer = Q.defer()
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
      console.log('sass')
      defer.resolve()
    })
  })
  return defer.promise
}

function buildPug (conf, Q) {
  let defer = Q.defer()
  let render = pug.compileFile('src/index.pug')
  let html = render(conf)
  fs.writeFile('www/index.html', html, function (err) {
    if (err) {
      throw new Error('Oh no! pug build failed', err)
    }
    console.log('pug')
    defer.resolve()
  })
  return defer.promise
}

function buildJs (Q) {
  let defer = Q.defer()
  bundleJs(null, defer)
  return defer.promise
}

function bundleJs (test, defer) {
  // build-js: browserify -t stringify -t require-globify ./src/index.js | uglifyjs > ./www/js/index.min.js
  let source = (test) ? test.in : loadSource()
  let outfile = (test) ? test.out : path.join(cwd, '/www/js/index.min.js')
  let chunks = []
  let b = browserify({
    entries: [source],
    cache: {},
    packageCache: {}
  })
  b.transform(stringify)
  b.transform(globify)
  let r = b.bundle().pipe(fs.createWriteStream(outfile))
  r.on('finish', function () {
    let uglyfied = uglify.minify(outfile, {
      mangle: false,
      output: {
        comments: false
      }
    }).code
    fs.writeFileSync(outfile, uglyfied, 'utf8')
    if (defer) {
       console.log('js')
       defer.resolve()
    }
  })
}

module.exports = {
  help,
  copyHook,
  buildSpecs,
  startBundle,
  buildPug,
  buildSass,
  bundleJs,
  buildJs
}
