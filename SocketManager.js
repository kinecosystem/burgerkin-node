var socketByUserId = {}
module.exports = function (server,options) {

    console.log("ok")
    io = require('socket.io')(server)
    io.use(async function(socket, next){
        if (socket.handshake.query && socket.handshake.query.token) {
            try {
                //validate token
                next(null)
            }
            catch( error) {
                console.log("error", error)
                    socket.emit('action',{error:{message:error}})
                    socket.disconnect()
                    next(new Error(error))
                }
        } else {
            socket.disconnect()
        }
    }) 
    io.on('connection',function (socket,next) {
        socket.on('action',async function (action,value,...args) { 
            //const cb = args[args.length-1]
            try {
        
            }
            catch( err) {
            
            }
        })
        socket.on('disconnect',async function() {
            // try { await rekuire('Engine.js').actionNew(socket.game,'leave',socket.userId) } catch(err){}
            // delete socketByUserId[socket.userId]  
        })
    })
}