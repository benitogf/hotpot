# Hotpot

[![Build Status][build-image]][build-url]
[![CoverageStatus][coverage-image]][coverage-url]
[![daviddep][david-dep-image]][david-dep-url]
[![standardjs][standardjs-image]][standardjs-url]
[![npm][npm-image]][npm-url]

[build-url]: https://travis-ci.org/benitogf/hotpot
[build-image]: https://img.shields.io/travis/benitogf/hotpot/master.svg?style=flat-square
[coverage-image]: https://coveralls.io/repos/github/benitogf/hotpot/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/benitogf/hotpot?branch=master
[david-dep-image]: https://david-dm.org/benitogf/hotpot.svg
[david-dep-url]: https://david-dm.org/benitogf/hotpot/master
[standardjs-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standardjs-url]: http://standardjs.com/
[npm-image]: https://img.shields.io/npm/v/hotpot.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/hotpot
Cordova livereload server for Pug, SASS and Browserify

## requirements

- [Create a cordova app](http://cordova.apache.org/#getstarted)
- Create a [src](https://github.com/benitogf/hotpot/tree/master/client/src) folder in your app directory
- Create a [test](https://github.com/benitogf/hotpot/tree/master/client/test) folder in your app directory

## installation

npm install -g hotpot

## cli commands

```bash
hotpot help
```
show the command list

```bash
hotpot
```
run the server in livereload mode
 - options:
   - -t riot  
      riotify transform

```bash
hotpot build-specs
```
build the specs

```bash
hotpot copy-hook
```
copy a build cordova hook
