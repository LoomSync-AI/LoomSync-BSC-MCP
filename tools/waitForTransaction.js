import { ethers } from "ethers";

async function waitForTransaction(txHash, confirmations = 1) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate transaction hash format
    if (!txHash.startsWith("0x") || txHash.length !== 66) {
      throw new Error("Invalid transaction hash format");
    }

    // Wait for transaction receipt
    const startTime = Date.now();
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    const endTime = Date.now();
    const timeElapsed = ((endTime - startTime) / 1000).toFixed(2);

    // Check transaction status
    const success = receipt.status === 1;
    const statusEmoji = success ? "" : "";
    const statusText = success ? "Success" : "Failed";

    // Get transaction details
    const tx = await provider.getTransaction(txHash);

    return {
      transactionHash: txHash,
      status: success,
      confirmations,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: tx.from,
      to: tx.to,
      value: tx.value ? ethers.formatEther(tx.value) : "0",
      timeElapsed,
      formattedOutput: `${statusEmoji} Transaction ${statusText}\nHash: ${txHash}\nConfirmations: ${confirmations}\nBlock: ${receipt.blockNumber}\nFrom: ${tx.from}\nTo: ${tx.to}\nValue: ${tx.value ? ethers.formatEther(tx.value) : "0"} BNB\nGas Used: ${receipt.gasUsed.toString()}\nTime: ${timeElapsed} seconds`,
    };
  } catch (error) {
    throw error;
  }
}

export default waitForTransaction;
