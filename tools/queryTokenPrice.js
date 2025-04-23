import { ethers } from "ethers";

// PancakeSwap Factory address
const FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
// WBNB address on BSC (used as a base for price calculations)
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
// BUSD address on BSC (for calculating USD price)
const BUSD_ADDRESS = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
// USDT address on BSC (alternative stable for USD price)
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
// Native BNB special address
const NATIVE_BNB_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Factory ABI for getting the pair address
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

// ERC20 Token ABI
const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

// Pair ABI for getting reserves
const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
];

async function queryTokenPrice(tokenAddress) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate the address
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid token address provided");
    }

    // Handle native BNB special case
    if (tokenAddress.toLowerCase() === NATIVE_BNB_ADDRESS.toLowerCase()) {
      tokenAddress = WBNB_ADDRESS;
    }

    // Create token contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider,
    );

    // Get token information
    const tokenSymbol = await tokenContract.symbol();
    const tokenDecimals = await tokenContract.decimals();
    const tokenName = await tokenContract.name();

    // Create factory contract instance
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

    // Price calculation strategy:
    // 1. Try token/BUSD pair for direct USD price
    // 2. If not available, try token/USDT pair for direct USD price
    // 3. If not available, try token/WBNB pair, then get WBNB/BUSD price
    // 4. If none work, return error

    let priceInUSD;
    let priceInBNB;
    let liquidityUSD;
    let pricePath = "";

    // Try token/BUSD direct pair
    let pairAddress = await factory.getPair(tokenAddress, BUSD_ADDRESS);

    if (pairAddress !== ethers.ZeroAddress) {
      const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
      const token0 = await pair.token0();
      const reserves = await pair.getReserves();

      let tokenReserve, busdReserve;
      if (token0.toLowerCase() === tokenAddress.toLowerCase()) {
        tokenReserve = reserves[0];
        busdReserve = reserves[1];
      } else {
        tokenReserve = reserves[1];
        busdReserve = reserves[0];
      }

      // Calculate price: BUSD amount / Token amount
      // Adjust for different token decimals
      // Convert BigInt to Number for calculations
      const busdReserveNum = Number(ethers.formatUnits(busdReserve, 18));
      const tokenReserveNum = Number(
        ethers.formatUnits(tokenReserve, tokenDecimals),
      );

      priceInUSD = busdReserveNum / tokenReserveNum;
      liquidityUSD = busdReserveNum * 2;
      pricePath = `Direct ${tokenSymbol}/BUSD pair`;
    }

    // If BUSD pair not found, try USDT pair
    if (!priceInUSD) {
      pairAddress = await factory.getPair(tokenAddress, USDT_ADDRESS);

      if (pairAddress !== ethers.ZeroAddress) {
        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const token0 = await pair.token0();
        const reserves = await pair.getReserves();

        let tokenReserve, usdtReserve;
        if (token0.toLowerCase() === tokenAddress.toLowerCase()) {
          tokenReserve = reserves[0];
          usdtReserve = reserves[1];
        } else {
          tokenReserve = reserves[1];
          usdtReserve = reserves[0];
        }

        // Convert BigInt to Number for calculations
        const usdtReserveNum = Number(ethers.formatUnits(usdtReserve, 18));
        const tokenReserveNum = Number(
          ethers.formatUnits(tokenReserve, tokenDecimals),
        );

        priceInUSD = usdtReserveNum / tokenReserveNum;
        liquidityUSD = usdtReserveNum * 2;
        pricePath = `Direct ${tokenSymbol}/USDT pair`;
      }
    }

    // If no direct USD pair, try via BNB
    if (!priceInUSD) {
      // First, get token/WBNB price
      pairAddress = await factory.getPair(tokenAddress, WBNB_ADDRESS);

      if (pairAddress !== ethers.ZeroAddress) {
        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const token0 = await pair.token0();
        const reserves = await pair.getReserves();

        let tokenReserve, bnbReserve;
        if (token0.toLowerCase() === tokenAddress.toLowerCase()) {
          tokenReserve = reserves[0];
          bnbReserve = reserves[1];
        } else {
          tokenReserve = reserves[1];
          bnbReserve = reserves[0];
        }

        // Convert BigInt to Number for calculations
        const bnbReserveNum = Number(ethers.formatUnits(bnbReserve, 18));
        const tokenReserveNum = Number(
          ethers.formatUnits(tokenReserve, tokenDecimals),
        );

        priceInBNB = bnbReserveNum / tokenReserveNum;

        // Then, get BNB/BUSD price
        const bnbBusdPair = await factory.getPair(WBNB_ADDRESS, BUSD_ADDRESS);

        if (bnbBusdPair !== ethers.ZeroAddress) {
          const bnbPair = new ethers.Contract(bnbBusdPair, PAIR_ABI, provider);
          const bnbToken0 = await bnbPair.token0();
          const bnbReserves = await bnbPair.getReserves();

          let bnbReserveBusd, busdReserveBnb;
          if (bnbToken0.toLowerCase() === WBNB_ADDRESS.toLowerCase()) {
            bnbReserveBusd = bnbReserves[0];
            busdReserveBnb = bnbReserves[1];
          } else {
            bnbReserveBusd = bnbReserves[1];
            busdReserveBnb = bnbReserves[0];
          }

          // Convert BigInt to Number for calculations
          const busdReserveNum = Number(ethers.formatUnits(busdReserveBnb, 18));
          const bnbReserveBusdNum = Number(
            ethers.formatUnits(bnbReserveBusd, 18),
          );

          const bnbPriceInUSD = busdReserveNum / bnbReserveBusdNum;

          // Token USD price = Token BNB price * BNB USD price
          priceInUSD = priceInBNB * bnbPriceInUSD;
          liquidityUSD = bnbReserveNum * 2 * bnbPriceInUSD;
          pricePath = `${tokenSymbol}/WBNB → WBNB/BUSD`;
        }
      }
    }

    // If still no price found through any valid path
    if (!priceInUSD) {
      return `⚠️ No liquidity found for ${tokenSymbol} (${tokenName})\nToken Address: ${tokenAddress}\nUnable to calculate price due to lack of PancakeSwap liquidity pairs.`;
    }

    // Format the market cap if we have it
    let marketCapInfo = "";
    if (
      tokenAddress === WBNB_ADDRESS ||
      tokenAddress === BUSD_ADDRESS ||
      tokenAddress === USDT_ADDRESS
    ) {
      // For major tokens, market cap calculation isn't accurate from DEX data alone
      marketCapInfo = "Market Cap: Not calculated for major tokens\n";
    }

    // Format the response with proper number formatting
    return (
      `💰 Token Price Information\n` +
      `Token: ${tokenName} (${tokenSymbol})\n` +
      `Address: ${tokenAddress}\n` +
      `Price: $${priceInUSD.toFixed(priceInUSD < 0.001 ? 8 : priceInUSD < 1 ? 6 : 4)} USD\n` +
      (priceInBNB
        ? `Price in BNB: ${priceInBNB.toFixed(priceInBNB < 0.001 ? 8 : 6)} BNB\n`
        : "") +
      `${marketCapInfo}` +
      `Liquidity: $${formatLargeNumber(liquidityUSD)} USD\n` +
      `Price Source: ${pricePath} on PancakeSwap\n` +
      `Time: ${new Date().toISOString()}`
    );
  } catch (error) {
    console.error("Error querying token price:", error.message);
    return `⚠️ Error querying price: ${error.message}`;
  }
}

// Helper function to format large numbers
function formatLargeNumber(num) {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B";
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K";
  } else {
    return num.toFixed(2);
  }
}

export default queryTokenPrice;
