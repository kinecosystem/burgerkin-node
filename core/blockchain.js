const KinClient = require('@kinecosystem/kin-sdk-node').KinClient;
const Environment = require('@kinecosystem/kin-sdk-node').Environment;
const config = require('../config')

const client = new KinClient(Environment.Testnet);

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
  console.log("isAccountExisting -> " + wallet_address)
  return await client.isAccountExisting(wallet_address)
}

async function createAccount(wallet_address) {
  
  console.log("buildCreateAccount -> " + wallet_address)
  // Sign the account creation transaction
  const masterAccount = await getMasterAccount()
  const createAccountTransaction = masterAccount.buildCreateAccount({
    address: wallet_address,
    startingBalance: 1000,
    fee: 100,
    memoText: '1-bkin'
  })
  console.log("submitTransaction createAccountTransaction -> " + wallet_address)
  // Send the account creation transaction to blockchain
  await masterAccount.submitTransaction(createAccountTransaction)
}

module.exports = {
  isAccountExisting,
  createAccount
}