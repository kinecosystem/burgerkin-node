/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Alon Genosar.
 */

const express = require('express')
const router = express.Router()
const path = require('path')
const gameEngine = require('../game/gameEngine')
router.get('/reset',(req,res,next)=> {
  gameEngine.reset()
  res.send('done!')
})
module.exports = router;
