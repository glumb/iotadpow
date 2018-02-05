const idpow = require('../src/index.js')

const idpcs = new idpow.Server({
  minWeightMagnitude: 14,
  depth: 3,
  feePerTransaction: 1,
  depositAddress: 'JKHFORHNEWPHTDRLTMYXARCOFEFCPTTDIICHSKK9KXZBXOOXZPTJFVKMQZHTFFCVPHGUVPLGPJMPUFKFWQMAMGZXRX',
  provider: 'http://pow-fullnode-node:14265',
  listenOnPort: 14260,
  allowedCommands: ['getTransactionsToApprove', 'findTransactions', 'getNodeInfo', 'wereAddressesSpentFrom', 'getBalances'],
})
