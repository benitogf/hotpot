'use strict'

const hotpot = require('hotpot/lib')
const getConfig = require('hotpot/lib/config')

module.exports = function (context) {
  var platform = context.opts.platforms[0]
  if (context.opts.options.config === 'nw') {
    platform = 'nw'
  }
  console.log('starting pre build for ' + platform + ' platform')
  return new Promise((resolve, reject) => {
    getConfig(function (conf) {
      conf.platform = platform
      if (!conf.target) {
        conf.target = ['es6']
      }
      switch (platform) {
        case 'android':
          conf.base = 'file:///android_asset/www/'
          break
        case 'nw':
          conf.base = '#!/'
          break
      }
      Promise.all([
        hotpot.buildPug(conf),
        hotpot.buildSass(),
        hotpot.buildJs(conf.target)
      ]).then(function () {
        console.log('pre build done')
        resolve()
      }).catch(function (e) {
        console.error(e)
        reject(e)
      })
    })
  })
}
