var express = require('express');
var router = express.Router();
const Redis = require('redis')
const blockchain = require('../core/blockchain')

router.get('/send', async function(req, res, next) {
    console.log(req.query)
    try {
    //   const isAccountExists = await client.isAccountExisting(public_key)
    //   if (!isAccountExists) {
        
    //   }
      res.sendStatus(200)
    }
    catch (error) {
       res.render('error', { message:error.message, error: error });
    }
});
module.exports = router;