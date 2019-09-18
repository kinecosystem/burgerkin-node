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
const gameEngine = require('../game/gameEngine')

router.get('/login', async function (req, res, next) {
  const public_key = req.query.public_key
  try {
    if (!public_key)
      throw new Error("missing public_key")

    if (!await blockchain.isAccountExisting(public_key))
      await blockchain.createAccount(public_key)

    res.json({
      wallet_address: config.master_public_address
    })
  } catch (error) {
    console.log(error)
    next(error)
  }
});

router.post('/whitelistTransaction', async function (req, res, next) {
  const jso = req.body
  try {
   
    let result = await blockchain.whitelistTransaction( req.body )
    res.send(result)
  } catch (error) {
    next(error)
  }
});


router.get('/is-player-in-game', async function (req, res, next) {
  const public_key = req.query.public_key
  try {
    if (!public_key)
      throw new Error("missing public_key")

    const result = gameEngine.isPlayerInGame(public_key)
    console.log(result)
    res.json({ result: result })
  } catch (error) {
      next(error)
  }
});

module.exports = router;