'use strict'

const request = require('co-request')
const log = require('@ripple/five-bells-shared/services/log')('subscriber')

function Subscriber (config, crawler) {
  this.crawler = crawler
  this.notificationUri = config.server.base_uri + '/notifications'

  crawler.on('ledger', this.subscribeLedger)
}

// By using a single constant UUID we avoid duplicate subscriptions
// TODO Obviously that is a hack and will need to change eventually
const notificationUuid = '94f65a56-242c-4d9e-b2cb-d878c52fc3cc'

Subscriber.prototype.subscribeLedger = function *(ledger) {
  const _this = this

  log.info('subscribing to ' + ledger.id)

  try {
    // This is a hack. Creating an account on the ledger first
    let putAccountRes = yield request({
      method: 'put',
      url: ledger.id + '/accounts/' + 'vinnie',
      json: true,
      body: {
        name: ledger.id + '/accounts/' + 'vinnie',
        password: 'vinnie',
        balance: '0'
      }
    })
    if (putAccountRes.statusCode >= 400) {
      throw new Error('Unexpected status code ' + putAccountRes.statusCode)
    }

    yield request.put({
      url: ledger.id + '/subscriptions/' + notificationUuid,
      json: true,
      body: {
        owner: 'vinnie',
        event: 'transfer.create',
        target: _this.notificationUri
      }
    })
  } catch (err) {
    log.warn('could not reach ledger ' + ledger.id)
  }
}

exports.Subscriber = Subscriber
