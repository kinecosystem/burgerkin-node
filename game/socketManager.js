/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Alon Genosar.
 */


let config = require('../config')
const { doAction, actions, eventEmitter,test } = require('./gameEngine')
const gameEngine = require('./gameEngine')

// Model
const socketByUserId = []
const allowedUserActions = [ actions.FLIP, actions.JOIN, actions.RECOVER ]

// Game engine event listener
eventEmitter.on("action",( {gameId,action,callerId,value, result} ) => {
    io.to(gameId).emit("action", { action:action, callerId:callerId, value:value,result:result }) 
})
   
// API
module.exports = function (server,options,cb) {
    io = require('socket.io')(server)
    io.on('connection', async function (socket,next,a) {
        //console.log("Connecting",socket.handshake.query.token, socket.handshake.query.name)
        if (socket.handshake.query && 
            socket.handshake.query.token &&
            socket.handshake.query.token != 'undefined' &&
            socket.handshake.query.name &&
            socket.handshake.query.name != 'undefined') {
            try {
                let value = {
                    name: socket.handshake.query.name,
                    transactionId: socket.handshake.query.transactionId,
                    facebookId: socket.handshake.query.facebookId
                }
               
                let game = await doAction({ action:actions.JOIN, callerId:socket.handshake.query.token, value, socket })
                socket.gameId = game.id
                socket.join(game.id)
                console.log("joining to",game.id)
                socket.token = socket.handshake.query.token
                io.to(game.id).emit("action",{action:actions.JOIN, callerId:socket.token,value,result:game}) 
            }
            catch(error) {
                console.log("*** error",error)
                socket.disconnect()
            }
        } else {
            socket.disconnect()
        }
        socket.on('action',async function (action,value,cb) { 
            if( socket.token && allowedUserActions.indexOf(action) > -1 ) {
                try {
                   let result = await doAction({action, callerId:socket['token'], value, socket}) 
                      
                    if(cb)
                       cb(result)
                    
                    if( result && result.hasOwnProperty('id') && !socket.gameId ) {
                        socket.gameId = result.id
                        socket.join(result.id)
                        socket.token = socket.handshake.query.token
                    }
        
                    if(socket.gameId) 
                        io.to(socket.gameId).emit("action", { action: action, 
                                                              callerId:socket.token, 
                                                              value: value, 
                                                              result: result 
                                                            }) 
                }
                catch(error) {
                    if(cb)
                        cb( {error:{description:error.message }})
                        
                }
            }
        })
        socket.on('disconnect',async function() {
            doAction({action:actions.LEAVE,callerId:socket.handshake.query.token})
        })
    })
}
