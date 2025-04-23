import { ethers } from "ethers";

// BEP-20 Token ABI (simplified balanceOf)
const tokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

async function queryTokenBalance(walletAddress, tokenAddress) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate addresses
    if (!ethers.isAddress(walletAddress) || !ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid address");
    }

    // Create token contract instance
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

    // Get token decimals
    const decimals = await tokenContract.decimals();

    // Get raw balance
    const balance = await tokenContract.balanceOf(walletAddress);

    // Format balance with correct decimals
    const formattedBalance = ethers.formatUnits(balance, decimals);

    return `✅ Success\nWallet: ${walletAddress}\nToken: ${tokenAddress}\nBalance: ${formattedBalance}\n🪙 Token balance: ${formattedBalance}\nℹ️ This is the balance of the specified token contract`;
  } catch (error) {
    console.error("Error querying token balance:", error.message);
    throw error;
  }
}

export default queryTokenBalance;
