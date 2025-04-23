import { ethers } from "ethers";

// BEP-20/ERC20 Token ABI (simplified allowance function)
const tokenABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

async function queryTokenAllowance(ownerAddress, spenderAddress, tokenAddress) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate addresses
    if (
      !ethers.isAddress(ownerAddress) ||
      !ethers.isAddress(spenderAddress) ||
      !ethers.isAddress(tokenAddress)
    ) {
      throw new Error("Invalid address provided");
    }

    // Create token contract instance
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

    // Get token decimals and symbol
    const decimals = await tokenContract.decimals();
    let symbol = "";
    try {
      symbol = await tokenContract.symbol();
    } catch (error) {
      console.warn("Could not fetch token symbol:", error.message);
      symbol = "TOKEN";
    }

    // Get allowance
    const allowance = await tokenContract.allowance(
      ownerAddress,
      spenderAddress,
    );

    // Format allowance with correct decimals
    const formattedAllowance = ethers.formatUnits(allowance, decimals);

    return `✅ Success\nToken: ${tokenAddress} (${symbol})\nOwner: ${ownerAddress}\nSpender: ${spenderAddress}\nAllowance: ${formattedAllowance} ${symbol}\n${allowance.isZero() ? "⚠️ No allowance granted" : `🔓 Allowance granted: ${formattedAllowance} ${symbol}`}`;
  } catch (error) {
    console.error("Error querying token allowance:", error.message);
    throw error;
  }
}

export default queryTokenAllowance;
