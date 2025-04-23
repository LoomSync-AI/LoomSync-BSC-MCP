import { ethers } from "ethers";

async function queryBalance(address) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate the address
    if (!ethers.isAddress(address)) {
      throw new Error("Invalid address");
    }

    // Get the balance
    const balance = await provider.getBalance(address);

    // Convert balance from Wei to BNB
    const balanceInBNB = ethers.formatEther(balance);

    return `✅ Success\nAddress: ${address}\nBalance: ${balanceInBNB} BNB\n💰 Wallet ${address} has ${balanceInBNB} BNB`;
  } catch (error) {
    console.error("Error querying balance:", error.message);
    throw error;
  }
}

export default queryBalance;
