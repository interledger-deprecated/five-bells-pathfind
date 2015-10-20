'use strict'

const log = require('./log')('pathfinder')
const Graph = require('./dijkstra').Graph
const Crawler = require('./crawler').Crawler
const Orchestrator = require('./orchestrator').Orchestrator

function Pathfinder (config) {
  const _this = this

  this.crawler = new Crawler()
  this.crawler.addNodes(config.crawler.initialNodes)

  this.orchestrator = new Orchestrator(this.crawler)
  this.graph = {}

  this.crawler.on('pair', function *(pair) {
    _this.handleNewEdge(pair)
  })
}

Pathfinder.prototype.addNodes = function (nodes) {
  this.crawler.addNodes(nodes)
}

Pathfinder.prototype.quotePathFromDestination = function (query, path) {
  return this.orchestrator.quotePathFromDestination(query, path)
}

Pathfinder.prototype.getLedgers = function () {
  return this.crawler.getLedgers()
}

Pathfinder.prototype.crawl = function * () {
  yield this.crawler.crawl()
}

Pathfinder.prototype.handleNewEdge = function (pair) {
  log.info('pathfinder indexing edge', pair.source, '=>', pair.destination)
  if (!this.graph[pair.source]) {
    this.graph[pair.source] = {}
  }
  this.graph[pair.source][pair.destination] = 1
}

Pathfinder.prototype.findPath = function (sourceLedger, destinationLedger) {
  log.info('pathfinding ' + sourceLedger + ' -> ' + destinationLedger)

  const graph = new Graph(this.graph)
  const path = graph.findShortestPath(sourceLedger, destinationLedger)

  if (path) {
    log.info('found path: ' + path.join(' => '))
  } else {
    log.info('no path found')
  }

  return path
}

exports.Pathfinder = Pathfinder
