let config = require('./config')
let Game = require('./Game')




//user connected
//check if has public key
//check if public key has wallet
//register public_key -> socket
//call action joit to find a table in pending_tables, or open a new table
//join call actionset table state to either pending or turn

//
// M o d e l
//

var games = []
var gamesByUserId = {}

function action({action,callerId,value}) {
    console.log("action",action)
    switch (action) {
        case "join":
        if(!gamesByUserId[callerId]) {
            const game = new Game()
            game.players.push(callerId)
            games.push(game)
            gamesByUserId[callerId] = game
        }
        break

        case "turn":
        console.log("action turn")  
        break

        case "flip":
        break

        case "winner":
        break

        //Optional
        case "leave":
        const game = gamesByUserId[callerId]
        if(game && game.players.length < 2) {
            delete gamesByUserId[callerId]
            games = games.filter( g => g == game)
        }
        break
    }
    console.log(gamesByUserId,games)
} 

const allowedUserActions = ['flip']
module.exports = function (server,options) {
    io = require('socket.io')(server)
    // io.use(async function(socket, next){
    //     if (socket.handshake.query && socket.handshake.query.public_id,socket.handshake.query.name) {
    //             socket.name = "foo";
    //             socket.public_id = "foo";
    //             action(public_id,"join")
                
    //             //check wallet exists
    //             //add user_name to socket
    //             //validate token
    //             //Check for empty tables
    //             //add client to table or create new table
    //             next(null)
    //             //if not authenticated {
    //             // console.log("error", error)
    //             //     socket.emit('action',{error:{message:error}})
    //             //     socket.disconnect()
    //             //     next(new Error(error))
    //             // }
               
    //     } else {
    //         socket.disconnect()
    //     }
    // }) 
    io.on('connection',function (socket,next) {
        if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.name) {
            action({action:'join', callerId:socket.handshake.query.public_id, value:socket.handshake.query.name})
        }
        socket.on('action',async function (action,value,cb) { 
            if( allowedUserActions.indexOf(action) && socketByUserId[socket.handshake.query.public_id] ) {
                try {
                    console.log("a")
                    let result = await action({ action:action,
                                                callerId:socket.handshake.query.public_id,
                                                value:value})
                    if(cb)
                        cb(result)
                }
                catch(error) {
                    if(cb)
                        cb("error")
                }
            }
        })
        socket.on('disconnect',async function() {
            action({action:"leave",callerId:socket.handshake.query.token})
            // try { await rekuire('Engine.js').actionNew(socket.game,'leave',socket.userId) } catch(err){}
            // delete socketByUserId[socket.userId]  
        })
    })
}