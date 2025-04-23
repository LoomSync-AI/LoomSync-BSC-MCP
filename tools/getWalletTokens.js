import { ethers } from "ethers";

// BEP-20 Token ABI for basic info
const tokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
];

// BSC Scan API endpoint
const BSC_SCAN_API = "https://api.bscscan.com/api";

async function getWalletTokens(walletAddress) {
  const apiKey = process.env.BSCSCAN_API_KEY;  try {
    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      throw new Error("Invalid wallet address");
    }

    // Check if API key is provided
    if (!apiKey) {
      throw new Error("BSCScan API key is required");
    }

    // Build BSCScan API request URL
    const url = `${BSC_SCAN_API}?module=account&action=tokentx&address=${walletAddress}&sort=desc&apikey=${apiKey}`;

    // Fetch token transactions from BSCScan
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "1") {
      throw new Error(`BSCScan API error: ${data.message || "Unknown error"}`);
    }

    // Extract unique token addresses from transactions
    const tokenAddresses = new Set();
    data.result.forEach((tx) => {
      if (tx.tokenSymbol && tx.contractAddress) {
        tokenAddresses.add(tx.contractAddress.toLowerCase());
      }
    });

    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Query balance for each token
    const tokenDetails = [];
    let count = 0;

    for (const tokenAddress of tokenAddresses) {
      try {
        count++;

        // Create token contract instance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          tokenABI,
          provider,
        );

        // Get token details and balance in parallel
        const [name, symbol, decimals, balance] = await Promise.all([
          tokenContract.name().catch(() => "Unknown Token"),
          tokenContract.symbol().catch(() => "???"),
          tokenContract.decimals().catch(() => 18),
          tokenContract.balanceOf(walletAddress),
        ]);

        // Only include tokens with non-zero balance
        if (balance > 0) {
          const formattedBalance = ethers.formatUnits(balance, decimals);

          tokenDetails.push({
            address: tokenAddress,
            name,
            symbol,
            decimals,
            balance: formattedBalance,
            rawBalance: balance.toString(),
          });
        }
      } catch (error) {
        // 忽略错误，继续检查下一个代币
      }
    }

    // Sort tokens by balance value (descending)
    tokenDetails.sort((a, b) => {
      return parseFloat(b.balance) - parseFloat(a.balance);
    });

    // Format output
    let formattedOutput = `✅ Wallet Token Holdings\nWallet: ${walletAddress}\nTokens Found: ${tokenDetails.length}\n\n`;
    tokenDetails.forEach((token) => {
      formattedOutput += `${token.symbol}: ${token.balance}\n${token.name} (${token.address})\n\n`;
    });

    return {
      walletAddress,
      tokenCount: tokenDetails.length,
      tokens: tokenDetails,
      formattedOutput,
    };
  } catch (error) {
    throw error;
  }
}

export default getWalletTokens;
