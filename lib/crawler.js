'use strict'

const _ = require('lodash')
const request = require('co-request')
const emitter = require('co-emitter')
const log = require('./log')('crawler')

class Crawler extends emitter {
  constructor (opts) {
    super()

    this.queue = []
    this.nodes = {}
    this.visitedNodes = {}
    this.visitedPairs = {}
    this.ledgers = {}
    this.traders = {}

    this.addLedgers(opts.initialLedgers)
    this.addTraders(opts.initialTraders)
  }

  queueNode (type, uri) {
    const node = {
      type: type,
      uri: uri
    }
    this.queue.push(node)
    this.nodes[uri] = node
  }

  addLedgers (ledgers) {
    const _this = this
    if (Array.isArray(ledgers)) {
      ledgers.forEach(this.queueNode.bind(_this, 'ledger'))
    }
  }

  addTraders (traders) {
    const _this = this
    if (Array.isArray(traders)) {
      traders.forEach(this.queueNode.bind(_this, 'trader'))
    }
  }

  * crawlLedger (node) {
    this.ledgers[node.uri] = node
    yield this.emit('ledger', {id: node.uri})
    let res = yield request(node.uri + '/accounts', {json: true})
    if (res.statusCode === 200) {
      for (let person of res.body) {
        // Currently only traders have the `identity` property set
        if (person.identity) {
          if (!this.visitedNodes[person.identity]) {
            this.visitedNodes[person.identity] = true
            this.queueNode('trader', person.identity)
          }
        } else {
          const nodeId = person.id
          if (!this.visitedNodes[nodeId]) {
            this.visitedNodes[nodeId] = true
            yield this.emit('user', {
              id: nodeId,
              ledger: node.uri
            })
          }
        }
      }
    }
  }

  * crawlTrader (node) {
    this.traders[node.uri] = node
    let res = yield request(node.uri + '/pairs', {json: true})
    for (let pair of res.body) {
      if (!this.visitedNodes[pair.source_ledger]) {
        this.visitedNodes[pair.source_ledger] = true
        this.queueNode('ledger', pair.source_ledger)
      }
      if (!this.visitedNodes[pair.destination_ledger]) {
        this.visitedNodes[pair.destination_ledger] = true
        this.queueNode('ledger', pair.destination_ledger)
      }

      // For pathfinding we want to see all directed edges
      yield this.emit('pair', {
        source: pair.source_ledger,
        destination: pair.destination_ledger,
        uri: node.uri
      })

      // For the visualization we only care about unique connections
      const pairId = node.uri + ';' +
        (pair.source_ledger < pair.destination_ledger
          ? (pair.source_ledger + ';' + pair.destination_ledger)
          : (pair.destination_ledger + ';' + pair.source_ledger))

      if (!this.visitedPairs[pairId]) {
        this.visitedPairs[pairId] = true
        yield this.emit('trader', {
          source: pair.source_ledger,
          destination: pair.destination_ledger
        })
      }
    }
  }

  * crawl () {
    // If the queue is empty, recrawl from all known nodes
    if (this.queue.length === 0) {
      this.visitedNodes = {}
      this.queue = _.values(this.nodes)
    }

    while (this.queue.length > 0) {
      const node = this.queue.pop()
      this.visitedNodes[node.uri] = true
      // log.info('crawling ' + node.type + ' ' + node.uri)

      try {
        switch (node.type) {
          case 'ledger':
            yield this.crawlLedger(node)
            break
          case 'trader':
            yield this.crawlTrader(node)
            break
        }
      } catch (err) {
        log.warn('could not reach ' + node.type + ' ' + node.uri)
      }
    }

    log.info('crawler found ' + _.size(this.ledgers) + ' ledgers and ' + _.size(this.traders) + ' traders')
  }

  getLedgers () {
    return _.values(this.ledgers)
  }

}

exports.Crawler = Crawler
