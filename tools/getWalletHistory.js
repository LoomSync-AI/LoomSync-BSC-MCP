import { ethers } from "ethers";

// BSC Scan API endpoint
const BSC_SCAN_API = "https://api.bscscan.com/api";

async function getWalletHistory(walletAddress, limit = 20) {
  const apiKey = process.env.BSCSCAN_API_KEY;  try {
    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      throw new Error("Invalid wallet address");
    }

    // Check if API key is provided
    if (!apiKey) {
      throw new Error("BSCScan API key is required");
    }

    // Build BSCScan API request URL for normal transactions
    const normalTxUrl = `${BSC_SCAN_API}?module=account&action=txlist&address=${walletAddress}&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`;

    // Build BSCScan API request URL for token transactions
    const tokenTxUrl = `${BSC_SCAN_API}?module=account&action=tokentx&address=${walletAddress}&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`;

    // Fetch both normal and token transactions in parallel
    const [normalTxResponse, tokenTxResponse] = await Promise.all([
      fetch(normalTxUrl),
      fetch(tokenTxUrl),
    ]);

    const normalTxData = await normalTxResponse.json();
    const tokenTxData = await tokenTxResponse.json();

    if (
      normalTxData.status !== "1" &&
      normalTxData.message !== "No transactions found"
    ) {
      throw new Error(
        `BSCScan API error (normal tx): ${normalTxData.message || "Unknown error"}`,
      );
    }

    if (
      tokenTxData.status !== "1" &&
      tokenTxData.message !== "No transactions found"
    ) {
      throw new Error(
        `BSCScan API error (token tx): ${tokenTxData.message || "Unknown error"}`,
      );
    }

    // Process normal transactions
    const normalTransactions = normalTxData.result || [];
    const processedNormalTx = normalTransactions.map((tx) => {
      return {
        hash: tx.hash,
        blockNumber: parseInt(tx.blockNumber),
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasUsed: tx.gasUsed,
        isError: tx.isError === "1",
        type: "BNB Transfer",
      };
    });

    // Process token transactions
    const tokenTransactions = tokenTxData.result || [];
    const processedTokenTx = tokenTransactions.map((tx) => {
      return {
        hash: tx.hash,
        blockNumber: parseInt(tx.blockNumber),
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        from: tx.from,
        to: tx.to,
        tokenName: tx.tokenName,
        tokenSymbol: tx.tokenSymbol,
        value: ethers.formatUnits(tx.value, parseInt(tx.tokenDecimal)),
        contractAddress: tx.contractAddress,
        type: "Token Transfer",
      };
    });

    // Combine and sort all transactions by block number (descending)
    const allTransactions = [...processedNormalTx, ...processedTokenTx]
      .sort((a, b) => {
        return b.blockNumber - a.blockNumber;
      })
      .slice(0, limit);

    // Format output
    let formattedOutput = `u2705 Wallet Transaction History\nWallet: ${walletAddress}\nTransactions Found: ${allTransactions.length}\n\n`;

    allTransactions.forEach((tx, index) => {
      const date = new Date(tx.timestamp).toLocaleString();
      formattedOutput += `${index + 1}. [${date}] ${tx.type}\n`;

      if (tx.type === "BNB Transfer") {
        const direction =
          tx.from.toLowerCase() === walletAddress.toLowerCase()
            ? "Sent"
            : "Received";
        formattedOutput += `${direction} ${tx.value} BNB\n`;
        formattedOutput += `${tx.from} u2192 ${tx.to}\n`;
        if (tx.isError) formattedOutput += `u26a0ufe0f Failed Transaction\n`;
      } else {
        const direction =
          tx.from.toLowerCase() === walletAddress.toLowerCase()
            ? "Sent"
            : "Received";
        formattedOutput += `${direction} ${tx.value} ${tx.tokenSymbol}\n`;
        formattedOutput += `${tx.from} u2192 ${tx.to}\n`;
        formattedOutput += `Token: ${tx.tokenName} (${tx.contractAddress})\n`;
      }

      formattedOutput += `Tx: ${tx.hash}\n\n`;
    });

    return {
      walletAddress,
      transactionCount: allTransactions.length,
      transactions: allTransactions,
      formattedOutput,
    };
  } catch (error) {
    throw error;
  }
}

export default getWalletHistory;
