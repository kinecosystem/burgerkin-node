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
var socketByUserId = {}
var games = []
var gamesPending = []

function action(action,caller,value) {
    switch (action) {
        case "join":
        console.log("action join")
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
        break
    }
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
        if (socket.handshake.query && socket.handshake.query.public_id && socket.handshake.query.name) {
            action('join', socket.handshake.query.public_id, socket.handshake.query.name)
        }
        socket.on('action',async function (action,value,cb) { 
            if( allowedUserActions.indexOf(action) &&socketByUserId[socket.handshake.query.public_id] ) {
                try {
                    let result = await action(action,socket.handshake.query.public_id,value)
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
            // try { await rekuire('Engine.js').actionNew(socket.game,'leave',socket.userId) } catch(err){}
            // delete socketByUserId[socket.userId]  
        })
    })
}