/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Alon Genosar.
 */

class Player {
  
    constructor({id,name,facebookId,avatar}) {
        this.id = id
        this.name = name
        this.score = 0
        this.facebookId = facebookId
        this.avatar = avatar
    }
}
module.exports = Player