import { ethers } from "ethers";

// BEP-20 Token ABI for metadata
const tokenMetadataABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
];

async function getTokenMetadata(tokenAddress) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate address
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid token address");
    }

    // Create token contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      tokenMetadataABI,
      provider,
    );

    // Get token metadata
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.totalSupply(),
    ]);

    // Format total supply with correct decimals
    const formattedTotalSupply = ethers.formatUnits(totalSupply, decimals);

    return {
      name,
      symbol,
      decimals,
      totalSupply: formattedTotalSupply,
      formattedOutput: `\u2705 Token Metadata\nToken: ${tokenAddress}\nName: ${name}\nSymbol: ${symbol}\nDecimals: ${decimals}\nTotal Supply: ${formattedTotalSupply}`,
    };
  } catch (error) {
    throw error;
  }
}

export default getTokenMetadata;
