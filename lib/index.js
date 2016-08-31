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
const concat = require('concat-stream')
const Q = require('q')

function help () {
  let helper = `
  Available commands:

  hotpot

    Will run the server in livereload mode

  hotpot help

    Will show the command list

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

function loadDir (dir) {
  if (!dir) {
    dir = {
      hook: path.join(cwd, '/hooks'),
      src: path.join(cwd, '/src'),
      scss: path.join(cwd, '/src/scss'),
      www: path.join(cwd, '/www'),
      js: path.join(cwd, '/www/js')
    }
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

function buildSpecs (dir) {
  // build-specs: browserify -t stringify -t require-globify ./src/index.specs.js -d > ./www/js/index.specs.js
  var defer = Q.defer()
  if (!dir) {
    dir = {
      in: loadSpecs(),
      out: path.join(cwd, '/www/js/index.specs.js')
    }
  }
  let b = browserify({
    entries: [dir.in],
    cache: {},
    packageCache: {},
    debug: true
  })
  b.transform(stringify)
  b.transform(globify)
  let c = b.bundle().pipe(fs.createWriteStream(dir.out))
  c.on('finish', function () {
    defer.resolve()
  })
  return defer.promise
}

function startBundle (dir) {
  // watchify -t stringify -t require-globify -p [ ./server ] -d ./src/index.js -o ./www/js/index.bundle.js
  if (!dir) {
    dir = {
      in: loadSource(),
      out: path.join(cwd, '/www/js/index.bundle.js')
    }
  }
  let b = browserify({
    entries: [dir.in],
    cache: {},
    packageCache: {},
    plugin: [watchify],
    debug: true
  })
  b.transform(stringify)
  b.transform(globify)
  b.plugin(livereload, {outfile: dir.out})
}

function buildSass (conf) {
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
      defer.resolve()
    })
  })
  return defer.promise
}

function buildPug (conf) {
  let defer = Q.defer()
  let render = pug.compileFile('src/index.pug')
  let html = render(conf)
  fs.writeFile('www/index.html', html, function (err) {
    if (err) {
      throw new Error('Oh no! pug build failed', err)
    }
    defer.resolve()
  })
  return defer.promise
}

function buildJs (dir) {
  // build-js: browserify -t stringify -t require-globify ./src/index.js | uglifyjs > ./www/js/index.min.js
  let defer = Q.defer()
  let source = (dir) ? dir.in : loadSource()
  let outfile = (dir) ? dir.out : path.join(cwd, 'www/js/index.min.js')
  let b = browserify({
    entries: [source],
    cache: {},
    packageCache: {}
  })
  let gotBundle = function (bundle) {
    let uglyfied = uglify.minify(bundle, {
      fromString: true,
      mangle: false,
      output: {
        comments: false
      }
    }).code
    fs.writeFileSync(outfile, uglyfied, 'utf8')
    if (defer) {
      defer.resolve()
    }
  }
  b.transform(stringify)
  b.transform(globify)
  b.bundle().pipe(concat({encoding: 'string'}, gotBundle))
  return defer.promise
}

module.exports = {
  help,
  copyHook,
  buildSpecs,
  startBundle,
  buildSass,
  buildPug,
  buildJs
}
