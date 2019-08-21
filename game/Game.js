/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Alon Genosar.
 */

let config = require('../config')
var { newId } = require("uuid-pure")

let symbols = []
for(var i = 0; i < config.board_width * config.board_height / 2.0; i++) {
    symbols.push(i + 1)
    symbols.push(i + 1)
}
const states = Object.freeze({ PENDING: 'pending', STARTING:'starting', TURN: 'turn', RESULT: 'result', COMPLETED: 'completed' }) 
class Game {

    static get states() { return states }
    
    constructor() {
        this.id = newId(5)
        this.state = states.PENDING
        this.players = {}
        this.flipped = []
        this.turn = null
        this.boardSize = [config.board_width,config.board_height]
        this.board = this.shuffle(JSON.parse(JSON.stringify(symbols)))
    }
   
    shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;
        while (0 !== currentIndex) {
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;
          temporaryValue = array[currentIndex];
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
        }
        return array;
    }
   
    userFriendly() {
        let cpy = JSON.parse(JSON.stringify(this))
        cpy.board = cpy.board.map( item => { return item == null ? null : Math.min(item,0) } )
        this.flipped.forEach( index => {  cpy.board[index] = this.board[index] });
        //delete cpy.flipped
        return cpy
    }
   
    cardsLeft() {
        return this.board.filter( item => { return item != null }).length
    }
    
}
module.exports = Game