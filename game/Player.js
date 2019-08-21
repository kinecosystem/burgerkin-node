/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Alon Genosar.
 */

class Player {
  
    constructor({id,name,facebookId}) {
        this.id = id
        this.name = name
        this.score = 0
        this.facebookId = facebookId
    }
}
module.exports = Player