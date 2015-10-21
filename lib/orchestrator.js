'use strict'

const log = require('./log')('orchestrator')

const request = require('co-request')
const uuid = require('uuid4')

const MAX_CACHE_TIME = 30000 // milliseconds

function Orchestrator (crawler) {
  const self = this

  this.crawler = crawler
  this.pairs = {}

  this.quoteCache = {}

  crawler.on('pair', function *(pair) {
    self.handleTradingPair(pair)
  })
}

Orchestrator.prototype.handleTradingPair = function (pair) {
  this.pairs[pair.source + ';' + pair.destination] = pair.uri
}

Orchestrator.prototype.quotePathFromDestination = function *(params, path) {
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

    log.info('quoting hop', source, '=>', destination, '(via ' + trader + ')')
    let payment = yield this.getQuote(trader, query)
    payment.id = trader + '/payments/' + uuid()

    payments.unshift(payment)
    destination = source
    destination_amount = payment.source_transfers[0].credits[0].amount
    destination_expiry_duration = payment.source_transfers[0].expiry_duration
  }

  return payments
}

Orchestrator.prototype.quotePathsFromDestination = function * (params, paths) {
  return Promise.all(paths.forEach((path) => new Promise((fulfill) => fulfill(quotePathFromDestination(params, path)))))
}

function cacheQuote(cache, trader, sourceAsset, destinationAsset, quoteBody) {
  // this could be done more efficiently; can it be done more readably at the same time?
  if (!cache[trader]) { cache[trader] = {} }
  if (!cache[trader][sourceAsset]) { cache[trader][sourceAsset] = {} }
  if (!cache[trader][sourceAsset][destinationAsset]) { cache[trader][sourceAsset][destinationAsset] = {} }
  quoteBody.time_of_quote = Date.now()
  cache[trader][sourceAsset][destinationAsset] = quoteBody
}

function getCachedQuote(quoteCache, trader, sourceAsset, destinationAsset) {
  let cached = quoteCache[trader][sourceAsset][destinationAsset]
  if (cached) {
      if ((Date.now() - cached.time_of_quote) < MAX_CACHE_TIME) {
        return cached
      } else {
        quoteCache[trader][sourceAsset][destinationAsset] = nil
        return false
      }
  }
  return false
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
Orchestrator.prototype.getQuote = function * getQuote (trader, quoteOpts) {
  let sourceAsset = quoteOpts.source_asset;
  let destinationAsset = quoteOpts.destination_asset;

  let cachedQuote = getCachedQuote(this.quoteCache, trader, sourceAsset, destinationAsset)
  if (cachedQuote) { return cachedQuote }
  let req = yield request({
    uri: trader + '/quote',
    qs: quoteOpts,
    json: true
  })

  if (req.statusCode >= 400) {
    throw new Error('Server Error: ' + req.statusCode + ' ' + req.body)
  }

  cacheQuote(this.quoteCache, trader, sourceAsset, destinationAsset, req.body)

  return req.body
}

exports.Orchestrator = Orchestrator
