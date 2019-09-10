/**
 * 
 * Summary. 
 *
 * Desc
 *
 * @author Oren Zakay.
 */


const { KinClient, Transaction} = require('@kinecosystem/kin-sdk-node')
const Environment = require('@kinecosystem/kin-sdk-node').Environment;
const XdrTransaction = require('@kinecosystem/kin-base').Transaction;
const config = require('../config')
const client = new KinClient(Environment.Testnet);

setTimeout( ()=>{

},3000)
let masterAccount

async function getMasterAccount() {
  if (!masterAccount) {
    masterAccount = await client.createKinAccount({
      seed: config.master_seed,
      appId: config.appId
    });
  }
  return masterAccount
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
  // Sign the account creation transaction
  const masterAccount = await getMasterAccount()
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

async function payGameFee(walletPayload) {
    try {
      const account = await getMasterAccount()
      const whitelistTx = await account.whitelistTransaction(walletPayload)
     // const xdrTransaction = new XdrTransaction(whitelistTx)
     // const txRecord = await client._server.submitTransaction(xdrTransaction)
     // console.log(txRecord.hash)
      return whitelistTx
    } catch(error) {
        throw error
    }
}
async function payToUser(wallet_address, amount) {
  console.log("payToUser -> " + wallet_address + " with amount = " + amount)
  const masterAccount = await getMasterAccount()
  const transactionBuilder = await masterAccount.buildSendKin({
    address: wallet_address,
    amount: amount,
    fee: 0,
    memoText: createID(10)
  })

  await masterAccount.submitTransaction(transactionBuilder)
  console.log("payToUser submitTransaction -> ", transactionBuilder)
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
  payGameFee
}