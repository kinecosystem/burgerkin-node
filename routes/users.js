var express = require('express');
var router = express.Router();
const KinClient = require('@kinecosystem/kin-sdk-node').KinClient;
const Environment = require('@kinecosystem/kin-sdk-node').Environment;
const Redis = require('redis')

const publicKey = "GCUOZGHMN7XEGIDDCKDXWP732E2GKCYTBPSLY7PPJLDVBIBSKZUVPYTB"
const secret = "SC2RWEIWGJNKULQXSGM5J37RP3N5U6LHDURIHE6NBG5X6XOSIHBMMTQS"

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/login', async function(req, res, next) {
    let public_key = "GDESKVL37Y26EV7YQGTKCB56ZTHAXLLDPYUCSQJSKKHIIQ5SWFZKKUSH"
    let player_name = ""
    const client = new KinClient(Environment.Testnet);
    try {
      const pk = ""
      const account = await client.createKinAccount({ seed: 'SC2RWEIWGJNKULQXSGM5J37RP3N5U6LHDURIHE6NBG5X6XOSIHBMMTQS', appId:'bkin' });
      const createAccountBuilder = await account.buildCreateAccount({ address: public_key, startingBalance: 50,fee: 0, memoText: '1-bkin'})
      const result = await account.submitTransaction(createAccountBuilder)
      res.json(account)
    }
    catch (error) {
       res.render('error', { message:error.message, error: error });
    }
});
module.exports = router;