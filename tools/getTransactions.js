import { ethers } from "ethers";

async function getTransactions(address, limit = 10) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate the address
    if (!ethers.isAddress(address)) {
      throw new Error("Invalid address");
    }

    // Get transaction history
    const blockNumber = await provider.getBlockNumber();
    const transactions = [];

    // Scan recent blocks for transactions involving this address
    for (
      let i = blockNumber;
      i > blockNumber - 1000 && transactions.length < limit;
      i--
    ) {
      const block = await provider.getBlock(i, true);
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (
            tx.from.toLowerCase() === address.toLowerCase() ||
            (tx.to && tx.to.toLowerCase() === address.toLowerCase())
          ) {
            transactions.push({
              hash: tx.hash,
              blockNumber: tx.blockNumber,
              from: tx.from,
              to: tx.to,
              value: ethers.formatEther(tx.value),
              timestamp: new Date(block.timestamp * 1000).toISOString(),
            });
          }
        }
      }
    }

    // Build the formatted transactions
    const formattedTransactions = transactions
      .slice(0, limit)
      .map((tx) => {
        const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
        const emoji = isOutgoing ? "⬆️" : "⬇️";
        const formattedTime = new Date(tx.timestamp).toLocaleString();
        return `${emoji} Hash: ${tx.hash}\n   From: ${tx.from}\n   To: ${tx.to}\n   Value: ${tx.value} BNB\n   Time: ${formattedTime}\n`;
      })
      .join("\n");

    return `✅ Success\nAddress: ${address}\nFound ${transactions.length} transactions for ${address}\n\n${formattedTransactions}`;
  } catch (error) {
    console.error("Error getting transactions:", error.message);
    throw error;
  }
}

export default getTransactions;
