import { ethers } from "ethers";

async function estimateGas(fromAddress, toAddress, data = "", value = "0") {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate addresses
    if (!ethers.isAddress(fromAddress) || !ethers.isAddress(toAddress)) {
      throw new Error("Invalid address");
    }

    // Prepare transaction
    const txParams = {
      from: fromAddress,
      to: toAddress,
      data: data,
      value: ethers.parseEther(value),
    };

    // Estimate gas
    const gasEstimate = await provider.estimateGas(txParams);

    // Get current gas price
    const gasPrice = await provider.getFeeData();

    // Calculate total gas cost in BNB
    const gasCostWei = gasEstimate * gasPrice.gasPrice;
    const gasCostBNB = ethers.formatEther(gasCostWei);

    return {
      gasEstimate: gasEstimate.toString(),
      gasPrice: ethers.formatUnits(gasPrice.gasPrice, "gwei") + " Gwei",
      gasCostBNB,
      formattedOutput: `\u2705 Gas Estimation\nFrom: ${fromAddress}\nTo: ${toAddress}\nEstimated Gas: ${gasEstimate.toString()} units\nGas Price: ${ethers.formatUnits(gasPrice.gasPrice, "gwei")} Gwei\nTotal Cost: ${gasCostBNB} BNB`,
    };
  } catch (error) {
    throw error;
  }
}

export default estimateGas;
