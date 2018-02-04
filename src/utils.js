const IOTA = require('iota.lib.js')
const debug = require('debug')('utils')

const iotaLib = new IOTA()

module.exports = {
  validateTrytesFee: (trytesBundle, feePerTx, depositAddress) => {
    const numberOfTx = trytesBundle.length

    if (depositAddress.length === 90) { depositAddress = iotaLib.utils.noChecksum(depositAddress) }

    for (const trytes of trytesBundle) {
      const txObj = iotaLib.utils.transactionObject(trytes)

      if (txObj.address === depositAddress && txObj.value >= numberOfTx * feePerTx) {
        debug(`bundle valid. Required fee:${numberOfTx * feePerTx} actual fee:${txObj.value}`)
        return true
      }
    }
    debug(`bundle not valid. Required fee:${numberOfTx * feePerTx} deposit address: ${depositAddress}`)
    return false
  },
}
