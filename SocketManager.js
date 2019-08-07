let config = require('./config')
let Game = require('./Game')
const self = this
var games = []
var gamesByUserId = {}
const allowedUserActions = ['flip','echo','join']

process.stdout.write('\033c');
process.stdout.write('\x1Bc'); 
setInterval(() => {
    process.stdout.write('\033c');
process.stdout.write('\x1Bc'); 
    console.log( "*",games,Object.keys(gamesByUserId))
}, 2000);

async function doAction({action,callerId,value,socket}) {
    console.log(action,callerId,value)
    var game = gamesByUserId[callerId]
    switch (action) {
        case "join":
           
        if(!game) {
            const pendingGames = games.filter(game => game.state == 'pending')
            if(pendingGames.length) {
                game = pendingGames[0]
                game.players.push(callerId)
                gamesByUserId[callerId] = game
            }
        }
        if(!game) {
            game = new Game()
            game.players.push(callerId)
            games.push(game)
            gamesByUserId[callerId] = game
        }
        if(!game) {
            throw new Error("Can't create a game")
        } else { 
            game = game.copyWithHiddenBoard()
            if(game.state == 'pending' && game.players.length == 2) {
                setTimeout( async function() {
                    let game = await doAction({action:'turn',callerId:callerId,socket:socket})
                    if(game){
                        game = game.copyWithHiddenBoard()
                    }
                    roomEmit({socket:socket,action:"turn",result:game})
            }, 1000);
            }
            return game
        }
        break

        case "turn":
        if(!game) throw new Error("User not in game")
        if(game.state != 'pending' && game.state != 'turn' ) throw new Error("Turn not allowed")
        game.turn = game.turn ? game.players[ (game.players.indexOf(game.turn) + 1) % game.players.length ] :  game.players[0]
        game.state = 'turn'
        game.flipped = []
        return game
    
        case "flip":
        value = parseInt(value)
        if( !game ) throw new Error("User not in game")
        if( game.turn != callerId) throw new Error("Not your turn")
        if( value === undefined || value !== parseInt(value)) throw new Error("Invalid value")
        if( game.flipped && game.flipped.indexOf(value) > -1 ) throw new Error("Card already flipeed")
        if( game.flipped && game.flipped.length == 2 ) throw new Error("Cards already flipped")
        if( game.board[value] === null ) throw new Error("Card alread removed")
       
        game.flipped = game.flipped || []
        game.flipped.push(value)
        
        if( game.flipped.length == 2 ) {
            setTimeout( async function() {
                let game = await doAction({action:'turn',callerId:callerId,socket:socket})
                if(game){
                    game = game.copyWithHiddenBoard()
                }
                roomEmit({socket:socket,action:"turn",result:game})
            }, 1000);
        }

        return { position:value, symbol:game.board[value],match:0 }
       
        case "winner":
        break
        //Optional
        case "leave":
        const aGame = gamesByUserId[callerId]
        if( aGame && aGame.state == 'pending') {
            aGame.players.splice(aGame.players.indexOf(callerId),1)
            delete gamesByUserId[callerId]
            if(!aGame.players.length) 
                games.splice(games.indexOf(aGame),1)
        }
        break

        case "echo":
        return value
    }
} 

function roomEmit({socket,action,result}) {
    if(socket.gameId) 
        io.to(socket.gameId).emit("action",{action:action,callerId:socket.token,value:result}) 
}
module.exports = function (server,options,cb) {
    io = require('socket.io')(server)
    io.on('connection', async function (socket,next) {
        console.log("Connecting",socket.handshake.query.token, socket.handshake.query.name)
        if (socket.handshake.query && 
            socket.handshake.query.token &&
            socket.handshake.query.token != 'undefined' &&
            socket.handshake.query.name &&
            socket.handshake.query.name != 'undefined') {
            try {
                socket.token = socket.handshake.query.name + ":" + socket.handshake.query.token
                let game = await doAction({ action:'join', callerId: socket.token,socket:socket })
                socket.gameId = game.id
                socket.isAuthorized = true
                socket.join(game.id)
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
            console.log("socket recieved aciton",action,value, socket.isAuthorized)
            if( socket.isAuthorized && allowedUserActions.indexOf(action) > -1 ) {
                try {
                    
                   let result = await doAction({action:action,callerId:socket['token'], value:value,socket:socket})
                
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
            doAction({action:"leave",callerId:socket.handshake.query.token})
        })
    })
}
