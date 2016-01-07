'use strict'

const _ = require('lodash')
const co = require('co')
const BigNumber = require('bignumber.js')
const log = require('./log')('pathfinder')
const Graph = require('./graph').Graph
const Crawler = require('./crawler').Crawler
const QuotingClient = require('./quoting-client').QuotingClient

class Pathfinder {
  constructor (config) {
    const _this = this

    this.numPathsToQuote = config.numPathsToQuote || 3
    this.maxPathLength = config.maxPathLength || 10

    this.crawler = new Crawler(config.crawler)
    this.graph = {}
    this.quotingClient = new QuotingClient(this.crawler)

    this.crawler.on('pair', function (pair) {
      _this.handleNewEdge(pair)
    })
  }

  addNodes (nodes) {
    this.crawler.addNodes(nodes)
  }

  getLedgers () {
    return this.crawler.getLedgers()
  }

  crawl () {
    return co(this.crawler.crawl.bind(this.crawler))
  }

  handleNewEdge (pair) {
    if (!this.graph[pair.source]) {
      this.graph[pair.source] = {}
    }
    this.graph[pair.source][pair.destination] = 1
  }

  calculateCheapestPath (paths) {
    const cheapestPath = _.reduce(paths, function (cheapestPath, testPath) {
      if ((new BigNumber(cheapestPath[0].source_transfers[0].credits[0].amount))
          .lessThanOrEqualTo(testPath[0].source_transfers[0].credits[0].amount)) {
        return cheapestPath
      } else {
        return testPath
      }
    })

    return cheapestPath
  }

  * _findPath (sourceLedger, destinationLedger, destinationAmount) {
    log.info('findPath ' + sourceLedger + ' -> ' + destinationLedger)

    const graph = new Graph({
      map: this.graph,
      maxPathLength: this.maxPathLength
    })
    const paths = graph.findShortestPaths(sourceLedger, destinationLedger, this.numPathsToQuote)

    log.info('findPath found ' + paths.length + ' paths')

    const pathsQuotes = yield this.quotingClient.quotePathsFromDestination({
      destinationAmount
      // TODO add other params like destination expiry duration
    }, paths)

    log.info('got quotes for ' + pathsQuotes.length + ' paths')

    const cheapestPath = this.calculateCheapestPath(pathsQuotes)

    log.info('got cheapest path: ' + JSON.stringify(cheapestPath))

    return cheapestPath
  }

  findPath (sourceLedger, destinationLedger, destinationAmount) {
    return co(this._findPath.bind(this), sourceLedger, destinationLedger, destinationAmount)
  }
}

exports.Pathfinder = Pathfinder
