let config = require('./config')
let Game = require('./Game')
let Player = require('./Player')
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
         if( !callerId ) throw new Error("Missing callerId")
         
        if(!game) {
            const pendingGames = games.filter(game => game.state == 'pending')
            if(pendingGames.length) {
                game = pendingGames[0]
                game.players.push(new Player({id:callerId,name:value}))
                gamesByUserId[callerId] = game
            }
        }
        if(!game) {
            game = new Game()
            game.players.push(new Player( { id:callerId, name:value }))
            games.push(game)
            gamesByUserId[callerId] = game
        }
        if(!game) {
            throw new Error("Can't create a game")
        } else { 
            game = game.copyWithHiddenBoard()
            if(game.state == 'pending' && game.players.length == 2) {
                setTimeout( async function() {
                    let result = await doAction({action:'turn',callerId:callerId,socket:socket})
                    roomEmit({socket:socket,action:"turn",result:result})
            }, 1000);
            }
            return game
        }
        break

        case "turn":
        if(!game) throw new Error("User not in game")
        if(game.state != 'pending' && game.state != 'turn' ) throw new Error("Turn not allowed")
        if(game.turn) {
            const i = game.players.map( player => { return player.id }).indexOf(game.turn) 
            game.turn = game.players[ (i + 1) % game.players.length ].id
        } else {
            game.turn = game.players[0].id
        }
        game.state = 'turn'
        game.flipped = []
        return game.turn
    
        case "flip":
        value = parseInt(value)
        if( !game ) throw new Error("User not in game")
        if( game.state != 'turn') throw new Error("Turn not allowed in that state")
        if( game.turn != callerId) throw new Error("Not your turn")
        if( value === undefined || value !== parseInt(value)) throw new Error("Invalid value")
        if( game.flipped && game.flipped.indexOf(value) > -1 ) throw new Error("Card already flipeed")
        if( game.flipped && game.flipped.length == 2 ) throw new Error("Cards already flipped")
        if( game.board[value] === null ) throw new Error("Card alread removed")
       
        game.flipped = game.flipped || []
        game.flipped.push(value)
        

        const match = game.flipped.length == 2 && game.board[game.flipped[0]] === game.board[game.flipped[1] ]
        if( game.flipped.length == 2 ) {
          
            setTimeout( async function() { 
                if(match) { 
                     game.flipped.forEach( i => { game.board[i] = null  })    
                }
                if( game.cardsLeft() > 2 ) {
                    let result = await doAction({action:'turn',callerId:callerId,socket:socket})
                    roomEmit({  socket:socket, action:"turn", result:result})
                }
                else {
                    let result = await doAction({action:'win',callerId:callerId,socket:socket})
                    roomEmit({  socket:socket, action:"win", result:result})
                }
            }, 1000);
        }   
        return { position:value, symbol:game.board[value],match:match}
       
        case "win":
        var winnerId = game.players[0].score > game.players[1].score ? game.players[0].id : game.players[1].id
        game.players.forEach( player => { delete gamesByUserId[player.id] })
        games.splice(games.indexOf(game),1)
        return winnerId

        break
        //Optional
        case "leave":
        if( game && game.state == 'pending') {
            const i = game.player.map( player => { return player.id; }).indexOf(callerId);
            game.players.splice(i,1)
            delete gamesByUserId[callerId]
            if(!game.players.length) 
                games.splice(games.indexOf(game),1)
        }
        break

        case "echo":
        return value
    }
} 

function roomEmit({socket,action,result}) {
    if(socket.gameId) 
        io.to(socket.gameId).emit("action",{action:action,callerId:"server",value:result}) 
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
                //console.log(socket.handshake.query.token ,socket.handshake.query.name)
                let game = await doAction({ action:'join', callerId: socket.handshake.query.token ,value:socket.handshake.query.name,socket:socket })
                socket.gameId = game.id

                socket.join(game.id)
                socket.token = socket.handshake.query.token
                io.to(game.id).emit("action",{action:'join', callerId:socket.token}) 
            }
            catch(error) {
               // console.log(error)
                socket.disconnect()
            }
        } else {
            socket.disconnect()
        }
        socket.on('action',async function (action,value,cb) { 
           // console.log("socket recieved aciton",action,value, socket.isAuthorized)
            if( socket.token && allowedUserActions.indexOf(action) > -1 ) {
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
