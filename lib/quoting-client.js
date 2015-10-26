'use strict'

// const log = require('./log')('orchestrator')
const co = require('co')
const request = require('co-request')
const uuid = require('uuid4')

class QuotingClient {
  constuctor (crawler) {
    const self = this

    this.crawler = crawler
    this.pairs = {}

    crawler.on('pair', function *(pair) {
      self.handleTradingPair(pair)
    })
  }

  handleTradingPair (pair) {
    this.pairs[pair.source + ';' + pair.destination] = pair.uri
  }

  * quotePathFromDestination (params, path) {
    // log.debug('quotePathFromDestination path:' + path)
    path = path.slice()

    let destination = path.pop()
    let destination_amount = params.destination_amount
    let payments = []
    let destination_expiry_duration = 2 // seconds

    while (path.length) {
      let source = path.pop()
      let trader = this.pairs[source + ';' + destination]

      let query = {
        source_ledger: source,
        destination_ledger: destination,
        destination_amount: destination_amount,
        destination_expiry_duration: destination_expiry_duration
      }

      // log.debug('quoting hop', source, '=>', destination, '(via ' + trader + ')')

      let payment = yield this.getTraderQuote(trader, query)
      payment.id = trader + '/payments/' + uuid()

      payments.unshift(payment)
      destination = source
      destination_amount = payment.source_transfers[0].credits[0].amount
      destination_expiry_duration = payment.source_transfers[0].expiry_duration
    }

    return payments
  }

  quotePathsFromDestination (params, paths) {
    // log.debug('quotePathsFromDestination paths:' + paths + ' count:' + paths.length)
    let promiseList = paths.map((path) => {
      // log.debug('quotePathsFromDestination path:' + path)
      return co.wrap(this.quotePathFromDestination.bind(this))(params, path)
    })
    let pathsQuotes = Promise.all(promiseList)
    // log.debug('quotePathsFromDestination pathsQuotes:' + pathsQuotes)

    return pathsQuotes
  }

  /**
   * Get a quote from a trader.
   *
   * quoteOpts should include:
   *  source_ledger
   *  source_asset
   *  destination_ledger
   *  destination_asset
   *  destination_amount or source_amount
   */
  * getTraderQuote (trader, quoteOpts) {
    let req = yield request({
      uri: trader + '/quote',
      qs: quoteOpts,
      json: true
    })

    if (req.statusCode >= 400) {
      throw new Error('Server Error: ' + req.statusCode + ' ' + req.body)
    }

    return req.body
  }
}

exports.QuotingClient = QuotingClient
