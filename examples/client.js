const idpow = require('../src/index.js')

const SEED = 'SEED'

const idpc = new idpow.Client({
  maxFeePerTransaction: 1,
  maxFeePerBundle: 50,
  provider: 'http://localhost:14260',
})

const transfers = [{
  address: 'LABNGFFMNNWJRQ9WBAZGYJUPKQIZZGSOVHL9ZCBOIHDNLWPWPTDBMR9TUENBENHFPISOAQBZWORGCWIKJ',
  value: 0,
  tag: 'TEST',
}, {
  address: 'JKHFORHNEWPHTDRLTMYXARCOFEFCPTTDIICHSKK9KXZBXOOXZPTJFVKMQZHTFFCVPHGUVPLGPJMPUFKFWQMAMGZXRX',
  value: 0,
}]

idpc.sendTransfer(
  SEED,
  3,
  14,
  transfers,
  (e, d) => {
    if (e) {
      console.warn(e)
    } else {
      console.log(`bundle hash ${d[0].bundle}`)
    }
  },
)
