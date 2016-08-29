'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect
const hotpot = require('../lib')
const path = require('path')
const fs = require('fs')

describe('hotpot', function () {
  it('should return an object', function () {
    expect(hotpot).to.be.an.instanceOf(Object)
  })
})
describe('build-js', function (done) {
  let buildTest = {
    in: path.join(process.cwd(), '/client/src/index.js'),
    out: path.join(process.cwd(), '/client/www/js/index.min.js')
  }
  let outfile = false
  before(function () {
    hotpot.buildJs(buildTest)
  })
  before(function () {
    outfile = fs.statSync(buildTest.out)
  })
  it('should create index.min.js', function () {
    expect(outfile).to.be.an.instanceOf(Object)
  })
  after(function(){
    fs.unlinkSync(buildTest.out)
  })
})

describe('build-specs', function (done) {
  let buildTest = {
    in: path.join(process.cwd(), '/client/src/index.specs.js'),
    out: path.join(process.cwd(), '/client/www/js/index.specs.js')
  }
  let outfile = false
  before(function () {
    hotpot.buildSpecs(buildTest)
  })
  before(function () {
    outfile = fs.statSync(buildTest.out)
  })
  it('should create index.specs.js', function () {
    expect(outfile).to.be.an.instanceOf(Object)
  })
  after(function(){
    fs.unlinkSync(buildTest.out)
  })
})
