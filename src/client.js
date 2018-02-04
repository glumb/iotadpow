const IOTA = require('iota.lib.js')
const debug = require('debug')('Client')
const utils = require('./utils.js')
const commands = require('./commands.js')


class Client {
  constructor(options = {}) {
    this.options = {
      ...{
        maxFeePerTransaction: 10,
        maxFeePerBundle: 100,
        provider: 'http://localhost:14265',
        IDPOWProvider: options.provider,
      },
      ...options,
    }

    debug('Client initiated')
    debug(this.options)

    this.iotaLib = new IOTA({
      provider: this.options.provider,
    })
    this.iotaDPOWLib = new IOTA({
      provider: this.options.IDPOWProvider,
    })
  }

  getFeePerTx(cb) {
    debug('requesting fee')
    this.iotaDPOWLib.api.sendCommand({
      command: commands.getFeePerTransaction,
    }, (e, res) => {
      if (e || !res) {
        cb(e)
        return
      }
      cb(null, res.fee)
    })
  }

  getDepositAddress(cb) {
    debug('requesting fee address')
    this.iotaDPOWLib.api.sendCommand({
      command: commands.getDepositAddress,
    }, (e, res) => {
      if (e || !res) {
        cb(e)
        return
      }
      cb(null, res.address)
    })
  }

  sendTransfer(seed, depth, minWeightMagnitude, transfers, options, callback) {
    if (arguments.length === 5 && Object.prototype.toString.call(options) === '[object Function]') {
      callback = options
      options = {}
    }

    let numberOfTransfers = transfers.length
    // the POW fee uses one tx
    // minimum one input tx + one holding the signature part
    // adding one tx to send the remaining funds back
    numberOfTransfers += 4

    let feePerTx
    let address
    // guessing one input tx is needed. If more are needed, retry
    const tryWithNumberOFExpectedTransfers = () => {
      if (feePerTx > this.options.maxFeePerTransaction) {
        debug(`required fee per tx ${feePerTx} is greater max fee ${this.options.maxFeePerTransaction}`)
        callback(`required fee per tx ${feePerTx} is greater max fee ${this.options.maxFeePerTransaction}`)
      }
      if (numberOfTransfers * feePerTx > this.options.maxFeePerBundle) {
        debug(`required fee per bundle ${(numberOfTransfers * feePerTx)} is greater max fee ${this.options.maxFeePerBundle}`)
        callback(`required fee per bundle ${numberOfTransfers * feePerTx} is greater max fee ${this.options.maxFeePerBundle}`)
      }

      transfers.push({
        value: numberOfTransfers * feePerTx,
        address,
      })

      debug(`prepareTransfer. transfers: ${transfers.length} fee: ${numberOfTransfers * feePerTx}`)
      this.iotaLib.api.prepareTransfers(seed, transfers, options, (error, trytesBundle) => {
        if (error) {
          debug(error)
          return callback(error)
        }

        // may be caused by multiple input tx
        if (trytesBundle.length !== numberOfTransfers) {
          transfers.pop()
          debug('tx does not match numberOfTransfers: ', trytesBundle.length, numberOfTransfers)
          numberOfTransfers = trytesBundle.length
          tryWithNumberOFExpectedTransfers()
          return
        }

        debug(`number of tx per bundle: ${trytesBundle.length}`)
        debug(`estimated number of tx: ${numberOfTransfers}`)

        debug(utils.validateTrytesFee(trytesBundle, feePerTx, address))
        // for (const trytes of trytesBundle) {
        // debug(this.iotaLib.utils.transactionObject(trytes))
        // }
        this.attachToTangleDPOW(trytesBundle, minWeightMagnitude, callback)
      })
    }

    const execAfter = (number, cb) => {
      let numberAsyncCalls = 0 // poormans paralel asyc request without dependencies
      return () => {
        numberAsyncCalls++
        if (numberAsyncCalls === number) cb()
      }
    }

    const done = execAfter(2, tryWithNumberOFExpectedTransfers)

    this.getFeePerTx((e, fee) => {
      if (e) {
        debug(`getFeePerTx request error${e}`)
        callback(e)
        return
      }
      feePerTx = fee
      done()
    })
    this.getDepositAddress((e, addr) => {
      if (e) {
        debug(`getDepositAddress request error${e}`)
        callback(e)
        return
      }
      address = addr
      done()
    })
  }

  attachToTangleDPOW(trytes, minWeightMagnitude, cb) {
    const command = {
      command: commands.attachToTangleDPOW,
      minWeightMagnitude,
      trytes,
    }

    this.iotaDPOWLib.api.sendCommand(command, (e, res) => {
      if (e) cb(e)
      cb(null, res)
    })
  }
}

module.exports = Client
