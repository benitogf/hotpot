'use strict'

const fs = require('fs')
const xml2js = require('xml2js')
const path = require('path')
const parser = new xml2js.Parser()

function getConfig (cb, env) {
  fs.readFile(path.resolve(process.cwd() + '/config.xml'), function (err, data) {
    if (err) {
      throw err
    }
    parser.parseString(data, function (err, data) {
      if (err) {
        throw err
      }
      if ((data.widget.server && data.widget.client)) {
        let conf = {
          title: data.widget.name[0],
          author: data.widget.author[0]._,
          environment: env || 'dev',
          server: {
            host: data.widget.server[0].host[0],
            port: data.widget.server[0].port[0]
          },
          host: data.widget.client[0].host[0],
          port: data.widget.client[0].port[0],
          gapi: data.widget.client[0].gapi[0],
          ganalytics: data.widget.client[0].ganalytics[0],
          html5Mode: 'true',
          preUrl: '',
          base: '/'
        }
        cb(conf)
      } else {
        cb(false)
      }
    })
  })
}

module.exports = getConfig
