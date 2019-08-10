/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Oren Zakay.
 */

var express = require('express');
var router = express.Router();
const blockchain = require('../core/blockchain')
const config = require('../config')

router.get('/login', async function(req, res, next) {
    const public_key = req.query.public_key
    try {
      if(!public_key) 
        throw new Error("missing public_key")
      
      if(!await blockchain.isAccountExisting(public_key))
        await blockchain.createAccount(public_key)
      
        res.json({ wallet_address: config.master_public_address})
   }
    catch (error) {
      next(error)
      //res.status(400).json({error:{message:error.message}});
    }
});
module.exports = router;