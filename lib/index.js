'use strict'

const cwd = process.cwd()
const fs = require('fs')
const path = require('path')
const pug = require('pug')
const sass = require('node-sass')
const browserify = require('browserify')
const watchify = require('watchify')
const uglify = require('uglify-es')
const stringify = require('stringify')
const riotify = require('riotify')
const babelify = require('babelify')
const globify = require('require-globify')
const livereload = require('../server')
const getStream = require('get-stream')
const Q = require('q')

function help () {
  let helper = `
  Available commands:

  hotpot

    Will run the server in livereload mode

    options:
      -t riot   use riotify transform
      -t es6    use babelify transform

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
  let hook = fs.readFileSync(path.join(__dirname, '/../client/hooks/build.js'), 'utf-8')
  fs.writeFileSync(source, hook, 'utf8')
}

function applyTargets (b, targets) {
  if (targets.indexOf('riot') !== -1) {
    b.transform(globify)
    b.transform(riotify, { ext: 'html' })
  }
  if (targets.indexOf('string') !== -1) {
    b.transform(stringify)
    b.transform(globify)
    b.transform(babelify, { presets: ['babel-preset-env'].map(require.resolve) })
  }
  if (targets.indexOf('es6') !== -1) {
    b.transform(babelify, { presets: ['babel-preset-env'].map(require.resolve) })
  }
}

function buildSpecs (targets, dir) {
  // build-specs: browserify -t stringify -t require-globify ./src/index.specs.js -d > ./www/js/index.specs.js
  let defer = Q.defer()
  if (!dir) {
    dir = {
      in: loadSpecs(),
      out: path.join(cwd, '/www/js/index.specs.js')
    }
  }
  let b
  if (targets.indexOf('es6') === -1) {
    b = browserify({
      entries: [dir.in],
      cache: {},
      packageCache: {},
      debug: true
    })
    b.transform(stringify)
    b.transform(globify)
  } else {
    b = browserify({
      entries: [dir.in],
      cache: {},
      packageCache: {},
      debug: true
    })
    b.transform(babelify, { presets: ['babel-preset-env'].map(require.resolve) })
    b.bundle().pipe(fs.createWriteStream(dir.out))
  }
  let c = b.bundle().pipe(fs.createWriteStream(dir.out))
  c.on('finish', function () {
    defer.resolve()
  })
  return defer.promise
}

function startBundle (targets, dir) {
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

  applyTargets(b, targets)

  b.plugin(livereload, {outfile: dir.out})
}

function buildSass (dir) {
  if (!dir) {
    dir = {
      in: path.join(cwd, 'src/scss/index.scss'),
      out: path.join(cwd, 'www/css/index.css')
    }
  }
  var defer = Q.defer()
  sass.render({
    file: dir.in,
    includePaths: [
      path.join(cwd, 'node_modules'),
      path.join(cwd, 'lib'),
      path.join(cwd, 'src')
    ]
  }, function (err, result) {
    if (err) {
      throw err
    }
    fs.writeFile(dir.out, result.css, function (err) {
      if (err) {
        throw err
      }
      defer.resolve()
    })
  })
  return defer.promise
}

function buildPug (conf, dir) {
  if (!dir) {
    dir = {
      in: path.join(cwd, 'src/index.pug'),
      out: path.join(cwd, 'www/index.html')
    }
  }
  let defer = Q.defer()
  let render = pug.compileFile(dir.in)
  let html = render(conf)
  fs.writeFile(dir.out, html, function (err) {
    if (err) {
      throw new Error('Oh no! pug build failed', err)
    }
    defer.resolve()
  })
  return defer.promise
}

function buildJs (targets, dir) {
  // build-js: browserify -t stringify -t require-globify ./src/index.js | uglifyjs > ./www/js/index.min.js
  let source = (dir) ? dir.in : loadSource()
  let outfile = (dir) ? dir.out : path.join(cwd, 'www/js/index.min.js')
  let b = browserify({
    entries: [source],
    cache: {},
    packageCache: {}
  })
  let gotBundle = function (bundle) {
    let uglyfied = uglify.minify(bundle, {
      mangle: false,
      compress: {
        passes: 4
      },
      output: {
        beautify: true,
        comments: false
      }
    })
    if (!uglyfied.code) {
      throw new Error(uglyfied.error)
    }
    // console.log(bundle.length, uglyfied.code.length, uglyfied.error, source, targets)
    fs.writeFileSync(outfile, uglyfied.code, 'utf8')
  }

  applyTargets(b, targets)

  return getStream(b.bundle()).then(gotBundle)
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
