let config = require('./config')

let symbols = []
for(var i = 0; i < config.board_width * config.board_height / 2.0; i++) {
    symbols.push(i)
    symbols.push(i)
}

class Game {
    constructor() {
        this.state = null
        this.id = null
        this.players = []
        this.value = null
        this.action = null
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