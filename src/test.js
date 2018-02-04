const idpow = require('./index.js')

const idpcs = new idpow.Server({
  minWeightMagnitude: 14,
  depth: 3,
  feePerTransaction: 5,
  depositAddress: 'JKHFORHNEWPHTDRLTMYXARCOFEFCPTTDIICHSKK9KXZBXOOXZPTJFVKMQZHTFFCVPHGUVPLGPJMPUFKFWQMAMGZXRX',
  provider: 'http://localhost:14260',
  listenOnPort: 14265,
  allowedCommands: ['getTransactionsToApprove', 'findTransactions', 'getNodeInfo', 'wereAddressesSpentFrom', 'getBalances'],
})

const idpc = new idpow.Client({
  maxFeePerTransaction: 5,
  maxFeePerBundle: 50,
  provider: 'http://localhost:14265',
})

idpc.sendTransfer(
  'SEED',
  3,
  14, [{
    address: 'LABNGFFMNNWJRQ9WBAZGYJUPKQIZZGSOVHL9ZCBOIHDNLWPWPTDBMR9TUENBENHFPISOAQBZWORGCWIKJ',
    value: 0,
    tag: 'TEST',
  }, {
    address: 'JKHFORHNEWPHTDRLTMYXARCOFEFCPTTDIICHSKK9KXZBXOOXZPTJFVKMQZHTFFCVPHGUVPLGPJMPUFKFWQMAMGZXRX',
    value: 100,
  }],
  (e, d) => console.log(e, `bundle hash ${d[0].bundle}`),
)
