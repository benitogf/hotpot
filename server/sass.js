'use strict'

// express-compile-sass
const crypto = require('crypto')
const Path = require('path')
const fs = require('fs')
const cwd = process.cwd()
const Gaze = require('gaze').Gaze
const csserror = require('csserror')
const sass = require('node-sass')
const inlineSourceMapComment = require('inline-source-map-comment')

function compileSass (options) {
  options = options || {}
  let etagmap = {}
  let cache = {}
  let fileUrl
  let sassFileMap = {}
  let log = options.log
  let fileWatcher = new Gaze('', {
    debounceDelay: 1,
    cwd: options.root
  })

  fileWatcher.on('all', function (event, path) {
    if (event === 'deleted' || event === 'renamed') {
      // OSX combined with editors that do atomic file replacements
      // will not emit 'change' events: https://github.com/joyent/node/issues/2062
      // Remove the file watch and assume it will be re-added when the main file is requested again
      this.remove(path)
      fileChanged(path)
      delete sassFileMap[path]
      return
    }

    if (event === 'changed') {
      fileChanged(path)
    }
  })

  function bustCache (path) {
    delete etagmap[path]
    delete cache[path]
  }

  function fileChanged (path) {
    if (Array.isArray(sassFileMap[path])) {
      // A sass import was updated, trigger update on main file
      sassFileMap[path].forEach(function (mainFile) {
        log.info('SASS: ' + path + 'was updated --> busting cache and updating' + mainFile)
        bustCache(mainFile)

        // This is a hack.
        // Would be better to emit an event to the middleware communicating with the browser
        fs.utimes(mainFile, new Date(), new Date())
      })
    } else {
      log.info('SASS: ' + path + 'was updated, busting cache')
      bustCache(fileUrl)
    }
    options.io.emit('bundle')
  }

  function watchImports (main, imports) {
    if (!Array.isArray(imports)) {
      return
    }

    let importsToWatch = [main]

    imports.forEach(function (path) {
      if (path !== main) {
        if (!Array.isArray(sassFileMap[path])) {
          sassFileMap[path] = []
          importsToWatch.push(path)
        }

        if (sassFileMap[path].indexOf(main) === -1) {
          sassFileMap[path].push(main)
        }
      }
    })

    fileWatcher.add(importsToWatch, function (error) {
      if (error) {
        log.warn('Error setting up file watches')
        log.warn(error)
      }
      // else {
      //     log.info('SASS: '+ 'Watching sass @imports:\t', importsToWatch.join('\t'));
      // }
    })
  }

  return function (req, res, next) {
    function sendErrorResponse (err) {
      res.removeHeader('Content-Length')
      res.removeHeader('ETag')
      res.setHeader('Content-Type', 'text/css; charset=UTF-8')
      log.warn(err)
      res.end(csserror(err))
    }

    function sassError (err) {
      let errStr = 'express-compile-sass:\n  Syntax error in ' + req.originalUrl + ':' + err.line

      if (typeof err.column === 'number') {
        errStr += ':' + err.column
      }

      errStr += '\n' + err.message

      sendErrorResponse(errStr)
    }

    if (/\.(?:scss|sass)$/.test(req.path)) {
      fileUrl = Path.join(Path.resolve(options.root), req.path)

      res.set({
        'Content-Type': 'text/css; charset=UTF-8',
        'ETag': '"' + etagmap[fileUrl] + '"'
      })

      if (req.fresh) {
        // Leverage browser cache
        log.info('SASS: ' + 'Browser cache hit:' + fileUrl)
        res.sendStatus(304)
      } else if (cache[fileUrl]) {
        // Leverage server cache
        log.info('SASS: ' + 'Server cache hit:' + fileUrl)
        res.end(cache[fileUrl])
      } else {
        // Compile sass
        log.info('SASS: ' + 'Compiling sass file:' + fileUrl)
        let start = Date.now()

        sass.render({
          file: fileUrl,
          outFile: fileUrl,
          includePaths: [
            Path.dirname(fileUrl),
            Path.resolve(options.root),
            Path.join(cwd, 'node_modules'),
            Path.join(cwd, 'lib'),
            Path.join(cwd, 'src')
          ],
          sourceComments: !!options.sourceComments,
          sourceMap: !!options.sourceMap,
          omitSourceMapUrl: !!options.sourceMap,
          sourceMapContents: !!options.sourceMap
        }, function (err, result) {
          if (err) {
            return sassError(err)
          }

          log.info('SASS: ' + 'Compile time:', (Date.now() - start) + 'ms', fileUrl)

          let css = result.css.toString('utf8')

          if (result.map) {
            let comment = inlineSourceMapComment(result.map.toString('utf8'), {
              block: true
            })

            css += '\n' + comment + '\n'
          }

          let etag = crypto.createHash('md5').update(css).digest('hex').substr(0, 16) + '-compile-sass'

          res.setHeader('ETag', '"' + etag + '"')
          res.end(css)

          etagmap[fileUrl] = etag
          cache[fileUrl] = css

          watchImports(fileUrl, result.stats.includedFiles)
        })
      }
    } else {
      next()
    }
  }
}

module.exports = compileSass
