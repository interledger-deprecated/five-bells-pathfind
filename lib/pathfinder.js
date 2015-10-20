'use strict'

const log = require('./log')('pathfinder')
const Graph = require('./graph').Graph
const Crawler = require('./crawler').Crawler
const Orchestrator = require('./orchestrator').Orchestrator

function Pathfinder (config) {
  const _this = this

  // log.debug('new Pathfinder')

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

// Pathfinder.prototype.quotePathFromDestination = function (query, path) {
//   return this.orchestrator.quotePathFromDestination(query, path)
// }

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

function quotePathToString (path) {
  let outputStr = ''
  for (let pathSeg of path) {
    // log.debug('pathSeg:' + JSON.stringify(pathSeg))
    outputStr = outputStr.concat(', ' + pathSeg.source_transfers[0].ledger)
  }
  return outputStr
}

Pathfinder.prototype.findPath = function (sourceLedger, destinationLedger, destinationAmount) {
  log.info('findPath ' + sourceLedger + ' -> ' + destinationLedger)

  const graph = new Graph(this.graph)
  const paths = graph.findShortestPaths(sourceLedger, destinationLedger, 10)

  log.info('findPath found ' + paths.length + ' paths')
  // for (let p of paths) {
  //   log.info(' ' + p)
  // }
  const quotes = this.orchestrator.quotePathsFromDestination({destination_amount: (destinationAmount || 10)}, paths)
  // log.info('findPath quotes:' + JSON.stringify(quotes))
  return new Promise((fulfill, reject) => {
    let bestQ
    quotes.then(function (results) {
      // log.debug('quotes.then results:' + results)
      for (let q of results) {
        // log.debug('findPath q:' + quotePathToString(q))
        if (bestQ) {
          if (q[0].source_transfers[0].credits[0].amount < bestQ[0].source_transfers[0].credits[0]) {
            bestQ = q
          }
        } else { bestQ = q }
      }
      log.info('path with best quote:' + quotePathToString(bestQ))
      fulfill(bestQ)
    }).catch(reject)
  })
}

exports.Pathfinder = Pathfinder
