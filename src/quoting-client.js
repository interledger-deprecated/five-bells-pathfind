'use strict'

const request = require('superagent')
const uuid = require('uuid4')
const _ = require('lodash')

class QuotingClient {
  constructor (crawler) {
    this.crawler = crawler
    this.pairs = {}
    this.crawler.on('pair', this._handleTradingPair.bind(this))
  }

  _handleTradingPair (pair) {
    this.pairs[pair.source + ';' + pair.destination] = pair.uri
  }

  quotePaths (params, paths) {
    if (params.destination_amount) {
      return this.quotePathsFromDestination(params, paths)
    }
    if (params.source_amount) {
      return this.quotePathsFromSource(params, paths)
    }
    throw new Error('requires sourceAmount or destinationAmount')
  }

  quotePathsFromDestination (params, paths) {
    return paths.map((path) => this.quotePathFromDestination(params, path))
  }

  quotePathsFromSource (params, paths) {
    return paths.map((path) => this.quotePathFromSource(params, path))
  }

  * quotePathFromDestination (params, path) {
    params = _.clone(params)
    path = path.slice()
    const payments = []
    params.destination_expiry_duration = params.destination_expiry_duration || path.length + 1
    params.destination_ledger = path.pop()
    params.source_ledger = path.pop()
    while (params.source_ledger) {
      const payment = yield this.getTraderQuote(params)
      payments.unshift(payment)
      params = {
        source_ledger: path.pop(),
        destination_ledger: params.source_ledger,
        destination_amount: payment.source_transfers[0].credits[0].amount,
        destination_account: payment.source_transfers[0].credits[0].account,
        destination_expiry_duration: payment.source_transfers[0].expiry_duration
      }
    }
    return payments
  }

  * quotePathFromSource (params, path) {
    params = _.clone(params)
    path = path.slice()
    const payments = []
    params.source_expiry_duration = params.source_expiry_duration || 2 * path.length
    params.source_ledger = path.shift()
    params.destination_ledger = path.shift()
    while (params.destination_ledger) {
      const payment = yield this.getTraderQuote(params)
      payments.push(payment)
      params = {
        source_ledger: params.destination_ledger,
        destination_ledger: path.shift(),
        source_amount: payment.destination_transfers[0].debits[0].amount,
        source_account: payment.destination_transfers[0].debits[0].account,
        source_expiry_duration: payment.destination_transfers[0].expiry_duration
      }
    }
    return payments
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
  * getTraderQuote (quoteOpts) {
    const trader = this.pairs[quoteOpts.source_ledger + ';' + quoteOpts.destination_ledger]
    const res = yield request
      .get(trader + '/quote_local')
      .query(quoteOpts)
    if (res.status >= 400) {
      throw new Error('Server Error: ' + res.status + ' ' + res.body)
    }
    const payment = res.body
    payment.id = trader + '/payments/' + uuid()
    return payment
  }
}

exports.QuotingClient = QuotingClient
