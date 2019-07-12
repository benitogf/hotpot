'use strict'

const chai = require('chai')
const expect = chai.expect
const hotpot = require('../lib')
const path = require('path')
const fs = require('fs')
const cwd = process.cwd()

describe('hotpot', function () {
  it('should return an object', function () {
    expect(hotpot).to.be.an.instanceOf(Object)
  })
})

describe('build-js', function () {
  this.timeout(0)
  const buildTest = {
    in: path.join(cwd, '/client/src/index.js'),
    out: path.join(cwd, '/client/www/js/index.min.js')
  }
  let outfile = false
  before(function (done) {
    try {
      fs.unlinkSync(buildTest.out)
      done()
    } catch (e) {
      done()
    }
  })
  before(function (done) {
    hotpot.buildJs(['es6'], buildTest).then(done)
  })
  it('should create index.min.js', function () {
    outfile = fs.statSync(buildTest.out)
    expect(outfile).to.be.an.instanceOf(Object)
  })
})

describe('build-sass', function () {
  this.timeout(0)
  const buildTest = {
    in: path.join(cwd, '/client/src/scss/index.scss'),
    out: path.join(cwd, '/client/www/css/index.css')
  }
  let outfile = false
  before(function (done) {
    try {
      fs.unlinkSync(buildTest.out)
      done()
    } catch (e) {
      done()
    }
  })
  before(function (done) {
    hotpot.buildSass(buildTest).then(done)
  })
  it('should create index.css', function () {
    outfile = fs.statSync(buildTest.out)
    expect(outfile).to.be.an.instanceOf(Object)
  })
})

describe('build-pug', function () {
  this.timeout(0)
  const buildTest = {
    in: path.join(cwd, '/client/src/index.pug'),
    out: path.join(cwd, '/client/www/index.html')
  }
  let outfile = false
  before(function (done) {
    try {
      fs.unlinkSync(buildTest.out)
      done()
    } catch (e) {
      done()
    }
  })
  before(function (done) {
    hotpot.buildPug({
      server: {
        host: 'localhost',
        port: '8000'
      },
      environment: 'test',
      ganalytics: 'ganalytics'
    }, buildTest).then(done)
  })
  it('should create index.html', function () {
    outfile = fs.statSync(buildTest.out)
    expect(outfile).to.be.an.instanceOf(Object)
  })
})
