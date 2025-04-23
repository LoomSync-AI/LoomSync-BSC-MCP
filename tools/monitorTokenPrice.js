import { ethers } from "ethers";

// PancakeSwap Router ABI (simplified for price checking)
const routerABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)",
];

// WBNB address on BSC
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
// PancakeSwap Router address
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

async function monitorTokenPrice(tokenAddress, interval = 60, duration = 300) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate address
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid token address");
    }

    // Create router contract instance
    const router = new ethers.Contract(ROUTER, routerABI, provider);

    let lastPrice = null;
    let startTime = Date.now();
    let count = 0;
    let priceData = [];

    const checkPrice = async () => {
      try {
        // Amount in - 1 BNB
        const amountIn = ethers.parseEther("1");

        // Get amounts out
        const amounts = await router.getAmountsOut(amountIn, [
          WBNB,
          tokenAddress,
        ]);
        const currentPrice = ethers.formatEther(amounts[1]);

        // Calculate change
        let change = "";
        if (lastPrice !== null) {
          const changePercent = (
            ((parseFloat(currentPrice) - parseFloat(lastPrice)) /
              parseFloat(lastPrice)) *
            100
          ).toFixed(2);
          change =
            changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`;
        }

        // Format timestamp
        const timestamp = new Date().toLocaleTimeString();

        // Store price data
        priceData.push({
          timestamp,
          price: currentPrice,
          change,
        });

        lastPrice = currentPrice;
        count++;

        // Check if monitoring should continue
        if (Date.now() - startTime < duration * 1000) {
          setTimeout(checkPrice, interval * 1000);
        } else {
          // Monitoring completed, return price data
          return priceData;
        }
      } catch (error) {
        // 忽略错误，继续监控
      }
    };

    // Start monitoring
    return checkPrice();
  } catch (error) {
    throw error;
  }
}

export default monitorTokenPrice;
