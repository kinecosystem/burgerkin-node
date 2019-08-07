let config = require('./config')
var { newId } = require("uuid-pure")

let symbols = []
for(var i = 0; i < config.board_width * config.board_height / 2.0; i++) {
    symbols.push(i + 1)
    symbols.push(i + 1)
}

class Game {
    constructor() {
        this.id = newId(5)
        this.state = 'pending'
        this.players = []
        this.flipped = []
        this.turn = null
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
}
module.exports = Game