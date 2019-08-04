const KinClient = require('@kinecosystem/kin-sdk-node').KinClient;
const Environment = require('@kinecosystem/kin-sdk-node').Environment;
const config = require('../config')

const client = new KinClient(Environment.Testnet);
const masterAccount = createMaster()

async function createMaster() {
    return await client.createKinAccount({ seed: config.master_seed, appId: config.appId });
  }

async function isAccountExisting(wallet_address) {
    console.log("isAccountExisting -> " + wallet_address)
  return await client.isAccountExisting(wallet_address)
}

async function createAccount(wallet_address) {
    console.log("buildCreateAccount -> " + public_key)
    // Sign the account creation transaction
    const createAccountTransaction = await masterAccount.buildCreateAccount({ address: wallet_address, startingBalance: 1000, fee: 100, memoText: '1-bkin'})
    console.log("submitTransaction createAccountTransaction -> " + wallet_address)
    // Send the account creation transaction to blockchain
    const result = await masterAccount.submitTransaction(createAccountTransaction)
}

async function sendTransaction(transcation) {

}

module.exports = {
    isAccountExisting, createAccount, sendTransaction
}