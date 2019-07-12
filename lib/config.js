'use strict'

const fs = require('fs')
const xml2js = require('xml2js')
const path = require('path')
const parser = new xml2js.Parser()
const utils = require('../lib/utils')

function getConfig (cb, env) {
  fs.readFile(path.resolve(process.cwd() + '/config.xml'), function (err, data) {
    if (err) {
      throw err
    }
    parser.parseString(data, function (err, data) {
      if (err) {
        throw err
      }
      if (data.widget.dev && data.widget.prod && data.widget.client && data.widget.name && data.widget.author) {
        const conf = {
          title: data.widget.name[0],
          author: data.widget.author[0]._,
          env: env || process.env.NODE_ENV === 'production' ? 'production' : 'dev',
          server: {
            host: process.env.NODE_ENV === 'production' ? data.widget.prod[0].host[0] : data.widget.dev[0].host[0],
            port: process.env.NODE_ENV === 'production' ? data.widget.prod[0].port[0] : data.widget.dev[0].port[0]
          },
          host: data.widget.client[0].host[0],
          port: data.widget.client[0].port[0],
          gapi: data.widget.client[0].gapi[0],
          ganalytics: data.widget.client[0].ganalytics[0],
          html5Mode: 'true',
          preUrl: '',
          base: '/'
        }
        if (data.widget.client[0].target) {
          conf.target = data.widget.client[0].target[0]
          switch (conf.target) {
            case 'riot':
              conf.tags = utils.listTags()
              break
          }
        }
        cb(conf)
      } else {
        throw new Error('Missing config widgets: name, author, client, prod and dev are required')
      }
    })
  })
}

module.exports = getConfig
