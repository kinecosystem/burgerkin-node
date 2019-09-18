/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Oren Zakay, Alon Genosar
 */

const { KinClient, Transaction, Environment, Channels } = require('@kinecosystem/kin-sdk-node')
const config = require('../config')
const client = new KinClient(Environment.Testnet);
let masterAccount

async function init() {
  console.log("Creating channels")
  let keepers = await Channels.createChannels({
    environment: Environment.Testnet,
    baseSeed: config.master_seed,
    salt: "Dubon Haya Po",
    channelsCount: config.totalChannels,
    startingBalance: 0
  })
 
  let keys = keepers.map( item => {
      return item.seed
  })
  console.log("Creating master account")
  masterAccount = await client.createKinAccount({
    seed: config.master_seed,
    appId: config.appId,
    channelSecretKeys:keys
  });
  console.log("Channels created succsesfully")
}



async function isAccountExisting(wallet_address) {
  try {
    const result =  await client.isAccountExisting(wallet_address)
    return result
  }
  catch(error) {
    return false
  } 
}
//console.log(Environment.Testnet.passphrase)

async function validateTransaction(transactionId) {
  try {
    const data = await client.getTransactionData(transactionId)
    return  data 
            //check for correct amount
            && data.hasOwnProperty('amount') 
            && data.amount === config.game_fee 
            //check for transaction date
            && data.hasOwnProperty('timeStamp')
            &&  new Date() - Date(data.timestamp) < config.transaction_experation_in_sec // 10 sec
    }
    catch {
      return false
    }
}

async function createAccount(wallet_address) {
  console.log("buildCreateAccount -> " + wallet_address)
  let createAccountBuilder = await masterAccount.buildCreateAccount({
    address: wallet_address,
    startingBalance: 100,
    fee: 0,
    memoText: "C" + createID(9)
  })

  console.log("submitTransaction createAccountTransaction -> " + wallet_address)
  // // Send the account creation transaction to blockchain
  const id = await masterAccount.submitTransaction(createAccountBuilder)
  console.log("createAccount transaction id  -> ", id)
}

async function whitelistTransaction(walletPayload) {
    try {
      const whitelistTx = await masterAccount.whitelistTransaction(walletPayload)
      return whitelistTx
    } catch(error) {
        throw error
    }
}
async function payToUser(wallet_address, amount) {
    masterAccount.channelsPool.acquireChannel( async channel => {
      const transactionBuilder = await masterAccount.buildSendKin({
        address: wallet_address,
        amount: amount,
        fee: 0,
        memoText: createID(10),
        channel: channel
      })
      return await masterAccount.submitTransaction(transactionBuilder)
  })
}

function createID(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result
}

module.exports = {
  validateTransaction,
  isAccountExisting,
  createAccount,
  payToUser,
  whitelistTransaction,
  init
}