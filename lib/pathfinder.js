'use strict'

const log = require('./log')('pathfinder')
const Graph = require('./graph').Graph
const Crawler = require('./crawler').Crawler
const QuotingClient = require('./quoting-client').QuotingClient

function quotePathToString (path) {
  let outputStr = ''
  for (let pathSeg of path) {
    // log.debug('pathSeg:' + JSON.stringify(pathSeg))
    outputStr = outputStr.concat(', ' + pathSeg.source_transfers[0].ledger)
  }
  return outputStr
}

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

  findPath (sourceLedger, destinationLedger, destinationAmount) {
    log.info('findPath ' + sourceLedger + ' -> ' + destinationLedger)

    const graph = new Graph(this.graph)
    const paths = graph.findShortestPaths(sourceLedger, destinationLedger, 10)

    log.info('findPath found ' + paths.length + ' paths')

    const quotes = this.quotingClient.quotePathsFromDestination({destination_amount: (destinationAmount || 10)}, paths)
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
}

exports.Pathfinder = Pathfinder
