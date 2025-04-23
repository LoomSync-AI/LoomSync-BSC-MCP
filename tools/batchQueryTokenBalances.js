import { ethers } from "ethers";

// BEP-20 Token ABI (simplified balanceOf)
const tokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

async function batchQueryTokenBalances(walletAddress, tokenAddresses) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      throw new Error("Invalid wallet address");
    }

    // Validate token addresses
    for (const address of tokenAddresses) {
      if (!ethers.isAddress(address)) {
        throw new Error(`Invalid token address: ${address}`);
      }
    }

    const results = [];

    // Query each token balance
    for (const tokenAddress of tokenAddresses) {
      try {
        // Create token contract instance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          tokenABI,
          provider,
        );

        // Get token details and balance in parallel
        const [decimals, symbol, balance] = await Promise.all([
          tokenContract.decimals().catch(() => 18),
          tokenContract.symbol().catch(() => "???"),
          tokenContract.balanceOf(walletAddress),
        ]);

        // Format balance with correct decimals
        const formattedBalance = ethers.formatUnits(balance, decimals);

        results.push({
          tokenAddress,
          symbol,
          balance: formattedBalance,
          rawBalance: balance.toString(),
        });
      } catch (error) {
        results.push({
          tokenAddress,
          symbol: "ERROR",
          balance: "0",
          rawBalance: "0",
          error: error.message,
        });
      }
    }

    // Format output
    let formattedOutput = `✅ Batch Balance Query Results\nWallet: ${walletAddress}\n\n`;
    results.forEach((result) => {
      formattedOutput += `${result.symbol}: ${result.balance} (${result.tokenAddress})\n`;
    });

    return {
      walletAddress,
      balances: results,
      formattedOutput,
    };
  } catch (error) {
    throw error;
  }
}

export default batchQueryTokenBalances;
