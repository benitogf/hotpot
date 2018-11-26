'use strict'

const hotpot = require('hotpot/lib')
const getConfig = require('hotpot/lib/config')

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
    if (!conf.target) {
      conf.target = ['string']
    }
    switch (platform) {
      case 'android':
        conf.base = 'file:///android_asset/www/index.html#!/'
        conf.preUrl = 'index.html#!'
        conf.html5Mode = 'false'
        break
      case 'browser':
        conf.preUrl = ''
        conf.html5Mode = 'true'
        break
      case 'nw':
        conf.base = '#!/'
        conf.preUrl = 'index.html#!'
        conf.html5Mode = 'false'
        break
    }
    Q.all([
      hotpot.buildPug(conf),
      hotpot.buildSass(),
      hotpot.buildJs(conf.target)
    ]).then(function () {
      console.log('pre build done')
      deferral.resolve()
    }).catch(function (e) {
      console.error(e)
    })
  })
  return deferral.promise
}
