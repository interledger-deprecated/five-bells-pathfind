'use strict'

const _ = require('lodash')
const BigNumber = require('bignumber.js')
const log = require('./log')('pathfinder')
const Graph = require('./graph').Graph
const Crawler = require('./crawler').Crawler
const QuotingClient = require('./quoting-client').QuotingClient

class Pathfinder {
  constructor (config) {
    const _this = this

    this.crawler = new Crawler()
    this.crawler.addNodes(config.crawler.initialNodes)
    this.graph = {}
    this.crawler.on('pair', function *(pair) {
      _this.handleNewEdge(pair)
    })

    this.quotingClient = new QuotingClient(this.crawler)
  }

  addNodes (nodes) {
    this.crawler.addNodes(nodes)
  }

  getLedgers () {
    return this.crawler.getLedgers()
  }

  * crawl () {
    yield this.crawler.crawl()
  }

  handleNewEdge (pair) {
    log.info('pathfinder indexing edge', pair.source, '=>', pair.destination)
    if (!this.graph[pair.source]) {
      this.graph[pair.source] = {}
    }
    this.graph[pair.source][pair.destination] = 1
  }

  calculateCheapestPath (paths) {
    const cheapestPath = _.reduce(paths, function (cheapestPath, testPath) {
      if (BigNumber(cheapestPath.source_transfers[0].credits[0].amount)
          .lessThanOrEqualTo(testPath.source_transfers[0].credits[0].amount)) {
        return cheapestPath
      } else {
        return testPath
      }
    })

    return cheapestPath
  }

  * findPath (sourceLedger, destinationLedger, destinationAmount) {
    log.info('findPath ' + sourceLedger + ' -> ' + destinationLedger)

    const graph = new Graph(this.graph)
    const paths = graph.findShortestPaths(sourceLedger, destinationLedger, 10)

    log.debug('findPath found ' + paths.length + ' paths')

    const pathsQuotes = yield this.quotingClient.quotePathsFromDestination({
      destinationAmount
      // TODO add other params like destination expiry duration
    }, paths)
    const cheapestPath = this.calculateCheapestPath(pathsQuotes)

    log.debug('got cheapest path: ' + JSON.stringify(cheapestPath))

    return cheapestPath
  }
}

exports.Pathfinder = Pathfinder
