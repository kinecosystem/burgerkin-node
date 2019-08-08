let config = require('./config')
const gameEngine = require('./gameEngine')

const allowedUserActions = ['flip','echo','join']

if(config.monitor_tables) {
    process.stdout.write('\033c');
    process.stdout.write('\x1Bc'); 
    setInterval(() => {
        process.stdout.write('\033c');
        process.stdout.write('\x1Bc'); 
        console.log( "*",gameEngine.getGames())
    }, 2000);
}

module.exports = function (server,options,cb) {
    io = require('socket.io')(server)
    gameEngine.setSocket(io)
    io.on('connection', async function (socket,next) {
        //console.log("Connecting",socket.handshake.query.token, socket.handshake.query.name)
        if (socket.handshake.query && 
            socket.handshake.query.token &&
            socket.handshake.query.token != 'undefined' &&
            socket.handshake.query.name &&
            socket.handshake.query.name != 'undefined') {
            try {
                //console.log(socket.handshake.query.token ,socket.handshake.query.name)
                let game = await gameEngine.doAction({ action:'join', callerId: socket.handshake.query.token ,value:socket.handshake.query.name,socket:socket })
                socket.gameId = game.id

                socket.join(game.id)
                socket.token = socket.handshake.query.token
                io.to(game.id).emit("action",{action:'join', callerId:socket.token}) 
            }
            catch(error) {
                console.log(error)
                socket.disconnect()
            }
        } else {
            socket.disconnect()
        }
        socket.on('action',async function (action,value,cb) { 
           // console.log("socket recieved aciton",action,value, socket.isAuthorized)
            if( socket.token && allowedUserActions.indexOf(action) > -1 ) {
                try {
                   let result = await gameEngine.doAction({action:action,callerId:socket['token'], value:value,socket:socket})    
                    if(cb)
                       cb(result)
                      roomEmit({socket:socket,action:action,result:result})
                }
                catch(error) {
                    if(cb)
                        cb( {error:{description:error.message }})
                        
                }
            }
        })
        socket.on('disconnect',async function() {
            gameEngine.doAction({action:"leave",callerId:socket.handshake.query.token})
        })
    })
}
