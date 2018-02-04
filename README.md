# IOTA Delegated ProofOfWork

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/glumb/iotadpow/master/LICENSE.md) [![Travis](https://img.shields.io/travis/glumb/iotadpow.svg)](https://travis-ci.org/glumb/iotadpow) [![npm](https://img.shields.io/npm/v/$iotadpow$.svg)](https://www.npmjs.com/package/iotadpow) [![Codecov](https://img.shields.io/codecov/c/github/glumb/iotadpow.svg)](https://codecov.io/github/glumb/iotadpow)

Finally fees in IOTA!

**NOTE: This project is in experimental state. Don't use it in a production environment**

## What is it about?

IDPOW enables outsourcing the POW to a third party by paying a small fee per transaction. The fee is included in a bundle and signed by the client. The server can therefore only claim the fee by doing the bundles POW.

## Schema
![iotadpow](https://user-images.githubusercontent.com/3062564/35780574-c953b9bc-09dd-11e8-803e-9919d5dade35.png)

## API

### Client

A Client is used to send transaction bundles including the fee to a IDPOW Server.

```javascript
const idpow = require('./src/index.js')

const idpc = new idpow.Client({
  maxFeePerTransaction: 5, // value in IOTA
  maxFeePerBundle: 100, // maxFeePerTx * numberOfTxInBundle
  provider: 'http://localhost:14265',
})

const depth = 3
const minWeightMagnitude = 14

// api following the iota.lib.js api
idpc.sendTransfer(
  'SEED',
  depth,
  minWeightMagnitude,
  [{
    address: 'LABNGFFMNNWJRQ9WBAZGYJUPKQIZZGSOVHL9ZCBOIHDNLWPWPTDBMR9TUENBENHFPISOAQBZWORGCWIKJ',
    value: 10,
  }, {
    address: 'MESSAGELABNGFQ9WBAZGYJUPKQIZZGSOVHL9ZCBOIHDNLWPWPTDBMR9TUENBENHFPISOAQBZWORGCWIKJ',
    value: 0,
  }],
  (e, d) => console.log(e, d),
)
```

### Server

The server sits in front of a fullnode with POW enabled. It validates the incoming bundles to check the fee and deposit address. Valid bundles are forwarded to the fullnode for performing the POW.

``` js
const idpow = require('./src/index.js')

const idpcs = new idpow.Server({
  minWeightMagnitude: 14,
  depth: 3,
  feePerTransaction: 1,
  // address to transfer the fee to
  depositAddress: 'JKHFORHNEWPHTDRLTMYXARCOFEFCPTTDIICHSKK9KXZBXOOXZPTJFVKMQZHTFFCVPHGUVPLGPJMPUFKFWQMAMGZXRX',
  provider: 'http://localhost:14260', // fullnode url used for POW
  listenOnPort: 14265,
  // commands that are proxied/forwarded to the node specified as *provider*
  // those commands will be publicly available under *listenOnPort*
  allowedCommands: ['getTransactionsToApprove', 'findTransactions', 'getNodeInfo', 'wereAddressesSpentFrom', 'getBalances'],
})
```

#### IRI prerequisites
The iri listen port may be changed to 14260, so the IDPOW proxy can use the "default" 14265 port. The node does not have to be public. The public interface is provided by the IDPOW proxy.

#### How is the fee calculated
Fee is calculated per transaction. A bundle sending funds will likely have 5 transactions:

- 1 input tx
- 1 tx for second halve of signature
- 1 output tx to receiver
- 1 output tx to send the remaining funds to
- 1 fee tx

The fee is estimated and adjusted, if more input tx are needed. A bundle with 5 tx and a fee of 3i will result in a fee calculated as `numberOfTx*feePerTx=5*3=15`.


## Debug
Invoke node with `DEBUG=* node app.js` to see some debug output.

## TODO
- write tests
- publish to npm (not done due to experimental state)
- consider ixi module?
