/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Alon Genosar.
 */

const jclrz = require('json-colorz')
const config = require('../config')
const Game = require('./Game')
const Player = require('./Player')
const blockchain = require('../core/blockchain')
const events = require('events')
const Spinner = require('cli-spinner').Spinner;
const spinner = new Spinner("Monitoring Games")
const timerByGameId = {}
spinner.setSpinnerString(2)

//ENUMS
const actions = Object.freeze({ JOIN: 'join', RECOVER: 'recover', TURN: 'turn', FLIP: 'flip', RESULT: 'result', WIN: 'win', LEAVE: 'leave' }) 

//Model
var games = []
var gamesByUserId = {}

//Utils
function gameEmit( {gameId, action, sender = "server", callerId, value, result } ) {
    module.exports.eventEmitter.emit('action', { action:action, gameId:gameId, callerId:callerId, value:value, result:result })
}

//API
module.exports = {
    eventEmitter: new events.EventEmitter()
    ,actions: actions
    ,isPlayerInGame(callerId) {
        return gamesByUserId[callerId] !== undefined
    }
    ,reset: () => {
        games = []
        gamesByUserId = {}
    }
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
    ,doAction: async ({action,callerId,value}) => { 
        if(!config.monitor_tables)
            console.log("[gameEngine] doAction",{action:action,callerId:callerId,value:value})

        if( !callerId ) throw new Error("Missing callerId")
        var game = gamesByUserId[callerId]

        switch (action) {
            //
            // Recover
            //
            case action.RECOVER:
            if(!game)
                throw new Error("No active game")
            return game
        
            //
            // Join
            //
            case actions.JOIN: 
            if(game)
                return game.userFriendly()
            
            //Validate
            if( !value ) throw new Error("Missing transaction id" )
            if( !value.name ) throw new Error("Missing name" ) 
            //if( !value.transactionId ) throw new Error("Missing transaction id" ) 
            if(!await blockchain.isAccountExisting(callerId) ) throw new Error("Invalid public id")
            
            //Validate transaction
            await !blockchain.validateTransaction(value.transactionId)
            
            //Check for pending games
            game = games.filter( game => game.state == Game.states.PENDING && Object.keys(game.players).length < 2 )[0] || new Game()
           
            //Push game to games list if not already there
            if(games.indexOf(game) < 0 )
                games.push(game)
            
            //Add player to game object
            game.players[callerId] = new Player( { id:callerId, name:value.name,facebookId: value.facebookId } )
            
            //Index games by player
            gamesByUserId[callerId] = game
           
            //Change state to starting if two player's has joind
             if( Object.keys(game.players).length == 2 )
                game.state = Game.states.STARTING

            //Start game
            if( game.state == Game.states.STARTING ) {
                setTimeout( async function() {
                    module.exports.doAction({ action:actions.TURN, callerId:callerId } )
                }, 1000);
            }
            return game.userFriendly()
        
            //
            // Turn
            //
            case actions.TURN:
            if(!game) throw new Error("User not in game")
            if(game.state != Game.states.STARTING && game.state != Game.states.TURN  && game.state != Game.states.RESULT ) throw new Error("Turn not allowed")
           
            //Clear turn timeout
            clearTimeout( timerByGameId[game.id])
            delete game.stateTimeout
           
            const playersId = Object.keys(game.players)
            const i = playersId.indexOf(game.turn)
            game.turn = value || playersId[ (i + 1) % playersId.length]
            game.state = Game.states.TURN
            game.flipped = []
            
            //Set turn timout 
            game.stateTimeout = new Date().getTime() + config.turn_timeout
            timerByGameId[game.id] = setTimeout( async () => {
                delete timerByGameId[game.id]
                module.exports.doAction({ action:actions.RESULT, callerId:callerId } )
            },config.turn_timeout )
            gameEmit({ gameId:game.id,action:actions.TURN, value:value,result: game.userFriendly() } )
            return game.userFriendly()
        
            //
            // Flip
            //
            case actions.FLIP:
            value = parseInt(value)
            if( !game ) throw new Error("User not in game")
            if( game.state != Game.states.TURN ) throw new Error("Turn not allowed in that state")
            if( game.turn != callerId) throw new Error("Not your turn")
            if( value === undefined || value !== parseInt(value)) throw new Error("Invalid value")
            if( game.flipped && game.flipped.indexOf(value) > -1 ) throw new Error("Card already flipeed")
            if( game.flipped && game.flipped.length == 2 ) throw new Error("Cards already flipped")
            if( game.board[value] === null ) throw new Error("Card alread removed")
           
          


            game.flipped = game.flipped || []
            game.flipped.push(value)
            
            if( game.flipped.length == 2 ) {
                setTimeout( async function() { 
                    module.exports.doAction({ action: actions.RESULT, callerId })
                }, 1500 );
            }  
            return game.userFriendly()
           
            //
            // Result
            //
            case actions.RESULT:
            const match = game.flipped.length == 2 && game.board[game.flipped[0]] === game.board[game.flipped[1] ]
            var p = null
            if(match) { 
                const cardValue = game.board[game.flipped[0]]
                game.flipped.forEach( i => { game.board[i] = null  })  
                p = game.players[callerId]
                p.score += cardValue != config.bad_card_symbol_index ? 1 : -1
            }
     
            setTimeout( async function() { 
                if( game.cardsLeft() ) {
                      module.exports.doAction({ action: actions.TURN, callerId: callerId, value: match ? callerId : undefined })
                }
                else {
                    var winnerId = "tie"
                    let players = Object.values(game.players)
                    if( players[0].score !== players[1].score )
                        winnerId = players[0].score > players[1].score ? players[0].id : players[1].id
                    players.forEach( player => { delete gamesByUserId[player.id] })
                    games.splice(games.indexOf(game),1)
                    if(winnerId == 'tie') {
                        blockchain.payToUser( players[0].id, config.game_fee)
                        blockchain.payToUser( players[1].id, config.game_fee)
                    }
                    else {
                        blockchain.payToUser(winnerId, config.game_fee * 2)
                    }
                    game.state = Game.states.COMPLETED
                    gameEmit( { gameId:game.id,action:actions.WIN, value:winnerId, result: game } )
                }
            }, 100);
            game.state = Game.states.RESULT
            gameEmit( { gameId:game.id,action:actions.RESULT, value: match, callerId: "server",result: game.userFriendly()} )
            return match
    
            
            //
            // Leave
            //
            case actions.LEAVE:
            if( game && game.state == Game.states.PENDING ) {

                delete game.players[callerId]
                delete gamesByUserId[callerId]
                if(!Object.keys(game.players).length) 
                    games.splice(games.indexOf(game),1)
            
                blockchain.payToUser(callerId, config.game_fee )
            }
            break

            default:
            throw new Error("Action",action,"not supported")
        }
    } 
}