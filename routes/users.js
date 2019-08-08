var express = require('express');
var router = express.Router();
const Redis = require('redis')
const blockchain = require('../core/blockchain')
const config = require('../config')

router.get('/login', async function(req, res, next) {
    const public_key = req.query.public_key
    if (!public_key) { return res.status(400).send('public_key could not be empty') }
    
    try {
      const isAccountExists = await blockchain.isAccountExisting(public_key)
      console.log("isAccountExists -> " + isAccountExists)
      if (!isAccountExists) {
        await blockchain.createAccount(public_key)
      }


      await blockchain.payToUser(public_key, 10)

      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify({ wallet_address: config.master_public_address}))


    }
    catch (error) {
       res.render('error', { message:error.message, error: error });
    }
});
module.exports = router;