import { ethers } from "ethers";

function createWallet() {
  const wallet = ethers.Wallet.createRandom();

  return JSON.stringify({
    Address: wallet.address,
    PrivateKey: wallet.privateKey
  })
}

export default createWallet;