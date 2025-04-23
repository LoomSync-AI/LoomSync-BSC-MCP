import { ethers } from "ethers";

// BSC Scan API endpoint
const BSC_SCAN_API = "https://api.bscscan.com/api";

async function getTokenHolders(tokenAddress, limit = 20) {
  const apiKey = process.env.BSCSCAN_API_KEY;
  try {
    // Validate token address
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid token address");
    }

    // Check if API key is provided
    if (!apiKey) {
      throw new Error("BSCScan API key is required");
    }

    // Connect to the BSC network to get token info
    const provider = new ethers.JsonRpcProvider("https://binance.llamarpc.com");

    // Token ABI for basic info
    const tokenABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
    ];

    // Create token contract instance
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

    // Get token details
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.name().catch(() => "Unknown Token"),
      tokenContract.symbol().catch(() => "???"),
      tokenContract.decimals().catch(() => 18),
      tokenContract.totalSupply(),
    ]);

    const formattedTotalSupply = ethers.formatUnits(totalSupply, decimals);

    // Build BSCScan API request URL for token holders
    const url = `${BSC_SCAN_API}?module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=${limit}&apikey=${apiKey}`;

    // Fetch token holders from BSCScan
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "1") {
      throw new Error(`BSCScan API error: ${data.message || "Unknown error"}`);
    }

    // Process holder data
    const holders = data.result.map((holder) => {
      const balance = ethers.formatUnits(holder.TokenHolderQuantity, decimals);
      const percentage = (
        (parseFloat(balance) / parseFloat(formattedTotalSupply)) *
        100
      ).toFixed(4);

      return {
        address: holder.TokenHolderAddress,
        balance,
        rawBalance: holder.TokenHolderQuantity,
        percentage: `${percentage}%`,
      };
    });

    // Format output
    let formattedOutput = `\u2705 Top ${holders.length} Holders of ${name} (${symbol})\n`;
    formattedOutput += `Token Address: ${tokenAddress}\n`;
    formattedOutput += `Total Supply: ${formattedTotalSupply} ${symbol}\n\n`;
    formattedOutput += "Rank | Address | Balance | % of Supply\n";
    formattedOutput += "-----|---------|---------|------------\n";

    holders.forEach((holder, index) => {
      formattedOutput += `${index + 1} | ${holder.address} | ${holder.balance} ${symbol} | ${holder.percentage}\n`;
    });

    return {
      tokenAddress,
      name,
      symbol,
      totalSupply: formattedTotalSupply,
      holderCount: holders.length,
      holders,
      formattedOutput,
    };
  } catch (error) {
    throw error;
  }
}

export default getTokenHolders;
