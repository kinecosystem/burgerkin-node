let config = require('./config')
let Game = require('./Game')
let Player = require('./Player')
const blockchain = require('./core/blockchain')

var games = []
var gamesByUserId = {}
var io
function roomEmit({socket,action,sender = "server",result}) {
    if(socket.gameId) 
        io.to(socket.gameId).emit("action",{action:action,callerId:sender,value:result}) 
}

module.exports = {
    setSocket: (socketio) => { io = socketio },
    getGames: () => { return games },
    doAction: async ({action,callerId,value,socket}) => {
        console.log("doAction",action,callerId,value)
        var game = gamesByUserId[callerId]
        switch (action) {
            case "join":
            if( !callerId ) throw new Error("Missing callerId")
            const result = await blockchain.isAccountExisting(callerId)
            if(!result) throw new Error("Invalid public id")
         
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
                        let result = await module.exports.doAction({action:'turn',callerId:callerId,socket:socket})
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
            
            if( game.flipped.length == 2 ) {
                setTimeout( async function() { 
                    let result = await module.exports.doAction({action:'result',callerId:callerId,socket:socket})
                    roomEmit({  socket:socket, action:"result", result:result})
                }, 1000);
            }   
            return { position:value, symbol:game.board[value]}
           
            case "result":
            const match = game.flipped.length == 2 && game.board[game.flipped[0]] === game.board[game.flipped[1] ]
            var player = null

            if(match) { 
                game.flipped.forEach( i => { game.board[i] = null  })  
                p = game.players.filter( player => player.id == callerId)[0]
                p.score += 1
            }
            
            setTimeout( async function() { 
                if( game.cardsLeft() > 1 ) {
                    let result = await module.exports.doAction({action:'turn',callerId:callerId,socket:socket})
                    roomEmit({  socket:socket, action:"turn", result:result})
                }
                else {
                    let result = await module.exports.doAction({action:'win',callerId:callerId,socket:socket})
                    roomEmit({  socket:socket, action:"win", result:result})
                }
            }, 3000);

            return  { match:match, positions:game.flipped,player:p}
    
            case "win":
            console.log("win")
            var winnerId = game.players[0].score > game.players[1].score ? game.players[0].id : game.players[1].id
            game.players.forEach( player => { delete gamesByUserId[player.id] })
            games.splice(games.indexOf(game),1)
            blockchain.payToUser(winnerId,config.game_fee)
            return winnerId
            break
            //Optional
            case "leave":
            if( game && game.state == 'pending') {
                const i = game.players.map( player => { return player.id; }).indexOf(callerId);
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
}