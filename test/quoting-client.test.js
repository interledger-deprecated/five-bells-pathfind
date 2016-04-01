/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const nock = require('nock')
const QuotingClient = require('../src/quoting-client').QuotingClient

function FakeCrawler () { }
inherits(FakeCrawler, EventEmitter)

const pairs = {
  'http://ledger1.example;http://ledger2.example': 'http://trader12.example',
  'http://ledger2.example;http://ledger3.example': 'http://trader23.example'
}

// (alice -> trader12) -> (trader12 -> trader23) -> (trader23 -> bob)
const path = [
  'http://ledger1.example',
  'http://ledger2.example',
  'http://ledger3.example'
]

beforeEach(function () {
  this.client = new QuotingClient(new FakeCrawler())
  this.client.pairs = pairs
})

describe('QuotingClient#quotePaths', function () {
  it('throws if neither sourceAmount or destinationAmount are provided', function * () {
    try {
      yield this.client.quotePaths({}, [path])
    } catch (err) {
      assert.equal(err.message, 'requires sourceAmount or destinationAmount')
      return
    }
    assert(false)
  })
})

describe('QuotingClient#quotePathFromDestination', function () {
  const fixtures = require('./fixtures/from-destination')
  const quoteArgs12 = fixtures.quoteArgs12
  const quoteArgs23 = fixtures.quoteArgs23
  const quote12 = fixtures.quote12
  const quote23 = fixtures.quote23

  it('returns quotes', function * () {
    const quote23Nock = nock('http://trader23.example').get('/quote_local')
      .query(quoteArgs23)
      .reply(200, quote23)
    const quote12Nock = nock('http://trader12.example').get('/quote_local')
      .query(quoteArgs12)
      .reply(200, quote12)

    const quotes = yield this.client.quotePathFromDestination({
      destination_account: 'http://ledger3.example/accounts/bob',
      destination_amount: '100',
      destination_expiry_duration: 1
    }, path)

    quote23Nock.done()
    quote12Nock.done()

    assert.equal(quotes.length, 2)
    assert.equal(quotes[0].id.indexOf('http://trader12.example/payments/'), 0)
    assert.equal(quotes[1].id.indexOf('http://trader23.example/payments/'), 0)
    assert.equal(quotes[0].source_transfers[0].expiry_duration, 3)
    assert.equal(quotes[1].source_transfers[0].expiry_duration, 2)
  })

  it('throws on 400', function * () {
    const quote23Nock = nock('http://trader23.example').get('/quote_local')
      .query(quoteArgs23)
      .reply(400)

    try {
      yield this.client.quotePathFromDestination({
        destination_account: 'http://ledger3.example/accounts/bob',
        destination_amount: '100',
        destination_expiry_duration: 1
      }, path)
    } catch (err) {
      quote23Nock.done()
      return
    }
    assert(false)
  })
})

describe('QuotingClient#quotePathFromSource', function () {
  const fixtures = require('./fixtures/from-source')
  const quoteArgs12 = fixtures.quoteArgs12
  const quoteArgs23 = fixtures.quoteArgs23
  const quote12 = fixtures.quote12
  const quote23 = fixtures.quote23

  it('returns quotes', function * () {
    const quote12Nock = nock('http://trader12.example').get('/quote_local')
      .query(quoteArgs12)
      .reply(200, quote12)
    const quote23Nock = nock('http://trader23.example').get('/quote_local')
      .query(quoteArgs23)
      .reply(200, quote23)

    const quotes = yield this.client.quotePathFromSource({
      source_account: 'http://ledger1.example/accounts/alice',
      source_amount: '80',
      source_expiry_duration: 3
    }, path)

    quote23Nock.done()
    quote12Nock.done()

    assert.equal(quotes.length, 2)
    assert.equal(quotes[0].id.indexOf('http://trader12.example/payments/'), 0)
    assert.equal(quotes[1].id.indexOf('http://trader23.example/payments/'), 0)
    assert.equal(quotes[0].destination_transfers[0].expiry_duration, 2)
    assert.equal(quotes[1].destination_transfers[0].expiry_duration, 1)
  })
})
