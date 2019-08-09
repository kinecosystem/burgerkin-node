/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Alon Genosar.
 */

const jclrz = require('json-colorz')
const config = require('./config')
const Game = require('./Game')
const Player = require('./Player')
const blockchain = require('./core/blockchain')
const events = require('events')

const Spinner = require('cli-spinner').Spinner;
const spinner = new Spinner("Monitoring Games")
spinner.setSpinnerString(2)

//ENUMS
const actions = Object.freeze({ JOIN: 'join', RECOVER: 'recover', TURN: 'turn', FLIP: 'flip', RESULT: 'result', WIN: 'win', LEAVE: 'leave' }) 

//Model
const games = []
const gamesByUserId = {}

//Utils
function gameEmit( {gameId, action, sender = "server", callerId, value } ) {
    module.exports.eventEmitter.emit('action', { action:action, gameId:gameId, callerId:callerId, value:value })
}

//API
module.exports = {
    eventEmitter: new events.EventEmitter()
    ,actions: actions
    ,monitorTables: interval => {
        process.stdout.write('\033c');
        process.stdout.write('\x1Bc'); 
        spinner.start();
        setInterval(() => {
            process.stdout.write('\033c');
            process.stdout.write('\x1Bc'); 
           
    
            jclrz(games)
        }, interval);
    }
    ,doAction: async ({action,callerId,value,socket}) => { 
        if(!config.monitor_tables)
            console.log("doAction",action,callerId,value)

        var game = gamesByUserId[callerId]

        switch (action) {
            case actions.JOIN:
            if( !callerId ) throw new Error("Missing callerId")
            const result = await blockchain.isAccountExisting(callerId)
            if(!result) throw new Error("Invalid public id")
         
            if(!game) {
                const pendingGames = games.filter( game => game.state == Game.states.PENDING )
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
                if(game.state == Game.states.PENDING && game.players.length == 2) {
                    setTimeout( async function() {
                        let result = await module.exports.doAction({ action:actions.TURN, callerId:callerId, socket:socket } )
                        gameEmit( { gameId:game.id, action:actions.TURN, value:result, callerId:callerId } )
                }, 1000);
                }
                return game
            }
    
            case actions.TURN:
            if(!game) throw new Error("User not in game")
            if(game.state != Game.states.PENDING && game.state != Game.states.PLAYING ) throw new Error("Turn not allowed")
            if(game.turn) {
                const i = game.players.map( player => { return player.id }).indexOf(game.turn) 
                game.turn = game.players[ (i + 1) % game.players.length ].id
            } else {
                game.turn = game.players[0].id
            }
            game.state = Game.states.PLAYING
            game.flipped = []
            return game.turn
        
            case actions.FLIP:
            value = parseInt(value)
            if( !game ) throw new Error("User not in game")
            if( game.state != Game.states.PLAYING ) throw new Error("Turn not allowed in that state")
            if( game.turn != callerId) throw new Error("Not your turn")
            if( value === undefined || value !== parseInt(value)) throw new Error("Invalid value")
            if( game.flipped && game.flipped.indexOf(value) > -1 ) throw new Error("Card already flipeed")
            if( game.flipped && game.flipped.length == 2 ) throw new Error("Cards already flipped")
            if( game.board[value] === null ) throw new Error("Card alread removed")
           
            game.flipped = game.flipped || []
            game.flipped.push(value)
            
            if( game.flipped.length == 2 ) {
                setTimeout( async function() { 
                    let result = await module.exports.doAction({action:actions.RESULT,callerId:callerId})
                    gameEmit( { gameId:game.id,action:actions.RESULT, value:result,callerId:callerId } )
                }, 1000);
            }   
            return { position:value, symbol:game.board[value]}
           
            case actions.RESULT:
            const match = game.flipped.length == 2 && game.board[game.flipped[0]] === game.board[game.flipped[1] ]
            var p = null
            if(match) { 
                game.flipped.forEach( i => { game.board[i] = null  })  
                p = game.players.filter( player => player.id == callerId)[0]
                p.score += 1
            }
            
            setTimeout( async function() { 
                if( game.cardsLeft() > 1 ) {
                    let result = await module.exports.doAction({action:actions.TURN,callerId:callerId,socket:socket})
                    gameEmit( { gameId:game.id,action:actions.TURN, value:result } )
                }
                else {
                    let result = await module.exports.doAction({action:actions.WIN,callerId:callerId,socket:socket})
                    gameEmit( { gameId:game.id,action:actions.WIN, value:result } )
                }
            }, 3000);
            return  { match:match, callerId:callerId, positions:game.flipped,player:p}
    
            case actions.WIN:
            var winnerId = game.players[0].score > game.players[1].score ? game.players[0].id : game.players[1].id
            game.players.forEach( player => { delete gamesByUserId[player.id] })
            games.splice(games.indexOf(game),1)
            blockchain.payToUser(winnerId,config.game_fee)
            return winnerId
            break
    
            case actions.LEAVE:
            if( game && game.state == Game.states.PENDING ) {
                const i = game.players.map( player => { return player.id; }).indexOf(callerId);
                game.players.splice(i,1)
                delete gamesByUserId[callerId]
                if(!game.players.length) 
                    games.splice(games.indexOf(game),1)
            }
            break

            default:
            throw new Error("Action",action," not supported")
        }
    } 
}