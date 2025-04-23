import { ethers } from "ethers";

async function getGasPrice() {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Get current fee data
    const feeData = await provider.getFeeData();

    // Format gas prices in Gwei
    const gasPrice = ethers.formatUnits(feeData.gasPrice, "gwei");
    const maxFeePerGas = feeData.maxFeePerGas
      ? ethers.formatUnits(feeData.maxFeePerGas, "gwei")
      : "N/A";
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
      ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei")
      : "N/A";

    return {
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      formattedOutput: `\u2705 Current Gas Prices on BSC\nGas Price: ${gasPrice} Gwei\nMax Fee Per Gas: ${maxFeePerGas} Gwei\nMax Priority Fee Per Gas: ${maxPriorityFeePerGas} Gwei\n\n\u2139\ufe0f These are the current gas prices on the Binance Smart Chain`,
    };
  } catch (error) {
    throw error;
  }
}

export default getGasPrice;
