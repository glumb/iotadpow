const IOTA = require('iota.lib.js')
const http = require('http')
const httpProxy = require('http-proxy')
const stream = require('stream')
const debug = require('debug')('Server')
const utils = require('./utils.js')
const commands = require('./commands.js')


class Server {
  constructor(options = {}) {
    this.options = {
      ...{
        minWeightMagnitude: 14,
        depth: 3,
        feePerTransaction: 1,
        depositAddress: 'JKHFORHNEWPHTDRLTMYXARCOFEFCPTTDIICHSKK9KXZBXOOXZPTJFVKMQZHTFFCVPHGUVPLGPJMPUFKFWQMAMGZXRX',
        provider: 'http://localhost:14265',
        listenOnPort: 14266,
        allowedCommands: ['getTransactionsToApprove', 'findTransactions', 'wereAddressesSpentFrom'],
      },
      ...options,
    }
    debug('Server initiated with ')
    debug(this.options)

    const proxy = httpProxy.createProxyServer({
      target: this.options.provider,
    })

    const server = http.createServer((req, res) => {
      // assemble the request body to check the command
      const body = []

      req.on('data', (chunk) => {
        body.push(chunk)
      }).on('end', () => {
        const bodyBuffer = Buffer.concat(body)
        // at this point, `body` has the entire request body stored in it as a string
        const cmdObj = JSON.parse(bodyBuffer.toString())

        if (!cmdObj.command) {
          res.writeHead(400)
          res.end()
          return
        }

        debug(`command received: ${cmdObj.command}`)
        if (Object.values(commands).indexOf(cmdObj.command) >= 0) {
          res.writeHead(200, {
            'Content-Type': 'application/json',
          })

          switch (cmdObj.command) {
            case commands.getDepositAddress:
              res.write(JSON.stringify({
                address: this.getDepositAddress(),
              }))
              res.end()
              break
            case commands.attachToTangleDPOW:
              this.addTransferBundleTrytes(cmdObj.trytes, (e, resp) => {
                console.log(e, 'resp', resp)
                res.write(JSON.stringify(resp))
                res.end()
              })
              break
            case commands.getFeePerTransaction:
              res.write(JSON.stringify({
                fee: this.getFeePerTransaction(),
              }))
              res.end()
              break
            default:
          }
        } else if (this.options.allowedCommands.indexOf(cmdObj.command) >= 0) {
          debug(`proxy request to: ${this.options.provider}`)
          const bufferStream = new stream.PassThrough()
          bufferStream.end(Buffer.from(bodyBuffer))

          proxy.web(req, res, {
            buffer: bufferStream,
          })
        } else {
          debug(`command: ${cmdObj.command} not in whitelist`)
          res.writeHead(422, {
            'Content-Type': 'application/json',
          })
          res.write(JSON.stringify({
            error: `COMMAND ${cmdObj.command} is not available on this node`,
          }))
          res.end()
        }
      })
    })

    debug(`listening on port ${this.options.listenOnPort}`)
    server.listen(this.options.listenOnPort)

    this.iotaLib = new IOTA(options)
  }

  addTransferBundleTrytes(trytes, cb) {
    if (utils.validateTrytesFee(trytes, this.options.feePerTransaction, this.options.depositAddress)) {
      debug('bundle valid, performing POW')
      this.iotaLib.api.sendTrytes(trytes, this.options.depth, this.options.minWeightMagnitude, cb)
    } else {
      debug('bundle invalid, not performing POW')
      cb(null, 'provided trytes invalid')
    }
  }

  setDepositAddress(address) {
    if (!this.iotaLib.valid.isAddress(address)) {
      debug(`invalid address: ${address}`)
      return new Error('invalid address')
    }

    this.options.depositAddress = (address.length === 90) ?
      address :
      this.iotaLib.utils.addChecksum(address)
  }

  getDepositAddress(withChecksum = true) {
    return (withChecksum) ?
      this.options.depositAddress :
      this.iotaLib.utils.noChecksum(this.options.depositAddress)
  }

  setFeePerTransaction(fee) {
    this.options.feePerTransaction = fee
  }

  getFeePerTransaction() {
    return this.options.feePerTransaction
  }
}

module.exports = Server
