// truffle.js config for klaytn.
const PrivateKeyConnector = require('connect-privkey-to-provider')
const NETWORK_ID = '1001'
const GASLIMIT = '20000000'
const URL = 'https://api.baobab.klaytn.net:8651'
const PRIVATE_KEY = '0x970b9aff1d4f136b970dbe3f3ad7a57dc07f2c0595168e88b7890964b2b3d14d'

module.exports = {
    networks: {
      klaytn: {
        provider: new PrivateKeyConnector(PRIVATE_KEY, URL),
        network_id: NETWORK_ID,
        gas: GASLIMIT,
        gasPrice: null,
      }
    },
}