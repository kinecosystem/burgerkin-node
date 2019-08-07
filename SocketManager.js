let config = require('./config')
let Game = require('./Game')
const self = this
var games = []
var gamesByUserId = {}
const allowedUserActions = ['flip','echo']
    process.stdout.write('\033c');
 process.stdout.write('\x1Bc'); 
// setInterval(() => {
//     process.stdout.write('\033c');
// process.stdout.write('\x1Bc'); 
//     console.log( "*",games,Object.keys(gamesByUserId))
// }, 2000);

async function doAction({action,callerId,value,socket}) {
    //console.log("action",action,callerId,value)
    var game = gamesByUserId[callerId]
    switch (action) {
        case "join":
        if(!game) {
           // console.log(games)
            const pendingGames = games.filter(game => game.state == 'pending');
           // console.log('pending',pendingGames)
            if(pendingGames.length) {
              //  console.log("join player to an existing game")
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
            game.board = game.board.map( item => { return Math.min(item,0) } )
        //     setTimeout( async function() {
        //         let result = await doAction({action:'turn',callerId:callerId,value:null,socket:socket})  
        //    }, 1000);
            return game
        }
        break

        case "turn":
        if( game ) {
            game.turn = game.turn ? game.players[ (game.players.indexOf(game.turn) + 1) % game.players.length ] :  game.players[0]
            game.flipped = []
            return game
        }
        throw new Error("User not in game")

        case "flip":
        let value = JSON.parse(value)
        if(!game ) throw new Error("User not in game")
        if(game.turn != callerId) throw new Error("Not your turn")
        if(!value || value !== parseInt(value)) throw new Error("Invalid value")
        if( game.flipped && game.flipped.indexOf(value)) throw new Error("Card already flipeed")
        if( game.board[value] === null ) throw new Error("Card alread removed")
       
        game.flipped = game.flipped || []
        game.flipped.push(value)
        return { value:value, symbol:game.board[value],match:0 }
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
    const room = Object.values(socket.rooms)[0] 
    // console.log(action,room)
    if(room) 
        io.to(room).emit("action",{action:action,value:result}) 
        io.broadcast.to(room).emit("action",{action:action,value:result}) 
}
module.exports = function (server,options,cb) {
    io = require('socket.io')(server)
    io.on('connection', async function (socket,next) {
        console.log("Connecting",socket.handshake.query.token, socket.handshake.query.name)
        if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.name) {
            try {
                let game = await doAction({action:'join', callerId:socket.handshake.query.token, value:socket.handshake.query.name,socket:socket})
                socket["gameId"] = game.id
                socket["token"] = socket.handshake.query.token
                socket["isAuthorized"] = true
                socket.join(game.id)
                io.to(game.id).emit("action",{action:'join',value:socket.handshake.query.name}) 
            }
            catch(error) {
                console.log(error)
                socket.disconnect()
            }
        }
        socket.on('action',async function (action,value,cb) { 
            if( socket.isAuthorized  && allowedUserActions.indexOf(action) ) {
                try {
                   let result = await doAction({action:action,callerId:socket['token'], value:value,socket:socket})
                   const room = Object.values(socket.rooms)[0]
                    if(room) 
                        io.to(room).emit("action",{action:action,value:result}) 
                    if(cb)
                       cb(result)
                }
                catch(error) {
                    console.log("action error",error)
                    if(cb)
                        cb("error ",error)
                }
            }
        })
        socket.on('disconnect',async function() {
            doAction({action:"leave",callerId:socket.handshake.query.token})
        })
    })
}
