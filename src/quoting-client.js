'use strict'

const request = require('superagent')
const uuid = require('uuid4')

class QuotingClient {
  constructor (crawler) {
    const _this = this

    this.crawler = crawler
    this.pairs = {}

    this.crawler.on('pair', function * (pair) {
      _this.handleTradingPair(pair)
    })
  }

  handleTradingPair (pair) {
    this.pairs[pair.source + ';' + pair.destination] = pair.uri
  }

  * quotePathFromDestination (params, path) {
    path = path.slice()

    let payments = []
    let destination = path.pop()
    let destinationAmount = params.destinationAmount
    let destinationExpiryDuration = params.destinationExpiryDuration ||
      path.length + 2

    while (path.length) {
      let source = path.pop()
      let trader = this.pairs[source + ';' + destination]

      let query = {
        source_ledger: source,
        destination_ledger: destination,
        destination_amount: destinationAmount,
        destination_expiry_duration: destinationExpiryDuration
      }

      let payment = yield this.getTraderQuote(trader, query)
      let paymentUuid = uuid()
      payment.id = trader + '/payments/' + paymentUuid

      payments.unshift(payment)
      destination = source
      destinationAmount = payment.source_transfers[0].credits[0].amount
      destinationExpiryDuration = payment.source_transfers[0].expiry_duration
    }

    return payments
  }

  quotePathsFromDestination (params, paths) {
    return paths.map((path) => {
      return this.quotePathFromDestination(params, path)
    })
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
    let res = yield request
      .get(trader + '/quote')
      .query(quoteOpts)
    if (res.status >= 400) {
      throw new Error('Server Error: ' + res.status + ' ' + res.body)
    }

    return res.body
  }
}

exports.QuotingClient = QuotingClient
