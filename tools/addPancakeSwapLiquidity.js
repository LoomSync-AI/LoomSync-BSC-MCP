import { ethers } from "ethers";

// PancakeSwap Router address
const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
// PancakeSwap Factory address
const FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
// WBNB address on BSC
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
// Native BNB special address
const NATIVE_BNB_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// PancakeSwap Router ABI (only liquidity related functions)
const ROUTER_ABI = [
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function factory() external pure returns (address)",
  "function WETH() external pure returns (address)",
  "function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB)",
];

// Factory ABI for getting the pair address
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

// ERC20 Token ABI
const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
];

// Pair ABI for getting reserves
const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
];

async function addPancakeSwapLiquidity({
  fromPrivateKey,
  tokenAAddress,
  tokenBAddress,
  amountA,
  amountB,
  slippage = 1,
}) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Create wallet from private key
    const wallet = new ethers.Wallet(fromPrivateKey, provider);
    const fromAddress = wallet.address;

    // Validate addresses
    if (!ethers.isAddress(tokenAAddress) || !ethers.isAddress(tokenBAddress)) {
      throw new Error("Invalid token address provided");
    }

    // Handle BNB special case - always make tokenB be BNB if one of the tokens is BNB
    let isETHInvolved = false;
    if (tokenAAddress.toLowerCase() === NATIVE_BNB_ADDRESS.toLowerCase()) {
      // Swap positions to make BNB the second token
      [tokenAAddress, tokenBAddress] = [tokenBAddress, tokenAAddress];
      [amountA, amountB] = [amountB, amountA];
      isETHInvolved = true;
    } else if (
      tokenBAddress.toLowerCase() === NATIVE_BNB_ADDRESS.toLowerCase()
    ) {
      isETHInvolved = true;
    }

    // Create router instance
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
    const routerWithSigner = router.connect(wallet);

    // Get token information
    let tokenAContract, tokenBContract;
    let tokenASymbol, tokenBSymbol;
    let tokenADecimals, tokenBDecimals;
    let amountAWei, amountBWei;

    // Get Token A details
    tokenAContract = new ethers.Contract(tokenAAddress, ERC20_ABI, provider);
    tokenASymbol = await tokenAContract.symbol();
    tokenADecimals = await tokenAContract.decimals();
    amountAWei = ethers.parseUnits(amountA.toString(), tokenADecimals);

    // Get Token B details (or use BNB defaults if it's native BNB)
    if (isETHInvolved) {
      tokenBSymbol = "BNB";
      tokenBDecimals = 18;
      amountBWei = ethers.parseEther(amountB.toString());
    } else {
      tokenBContract = new ethers.Contract(tokenBAddress, ERC20_ABI, provider);
      tokenBSymbol = await tokenBContract.symbol();
      tokenBDecimals = await tokenBContract.decimals();
      amountBWei = ethers.parseUnits(amountB.toString(), tokenBDecimals);
    }

    // Calculate min amounts with slippage protection
    const amountAMin =
      amountAWei -
      (amountAWei * BigInt(Math.floor(slippage * 100))) / BigInt(10000);
    const amountBMin =
      amountBWei -
      (amountBWei * BigInt(Math.floor(slippage * 100))) / BigInt(10000);

    // Get existing pair information, if it exists
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

    // Determine actual token addresses for pair (use WBNB for native BNB)
    const actualTokenA = tokenAAddress;
    const actualTokenB = isETHInvolved ? WBNB_ADDRESS : tokenBAddress;

    let pairAddress;
    try {
      pairAddress = await factory.getPair(actualTokenA, actualTokenB);
    } catch (error) {
      console.warn(
        "Error getting pair, may be creating a new pair:",
        error.message,
      );
    }

    // If pair exists, fetch price information
    let priceInfo = "";
    if (pairAddress && pairAddress !== ethers.ZeroAddress) {
      try {
        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const reserves = await pair.getReserves();
        const token0 = await pair.token0();

        let reserveA, reserveB;
        if (token0.toLowerCase() === actualTokenA.toLowerCase()) {
          reserveA = reserves[0];
          reserveB = reserves[1];
        } else {
          reserveA = reserves[1];
          reserveB = reserves[0];
        }

        const currentPrice = Number(reserveB) / Number(reserveA);
        const expectedPrice = Number(amountBWei) / Number(amountAWei);
        const priceDifference = Math.abs(
          ((expectedPrice - currentPrice) / currentPrice) * 100,
        );

        priceInfo = `Current pool ratio: 1 ${tokenASymbol} : ${currentPrice.toFixed(6)} ${tokenBSymbol}\n`;
        priceInfo += `Your deposit ratio: 1 ${tokenASymbol} : ${expectedPrice.toFixed(6)} ${tokenBSymbol}\n`;
        priceInfo += `Price impact: ${priceDifference.toFixed(2)}%\n`;
      } catch (error) {
        console.warn("Error calculating price info:", error.message);
      }
    } else {
      priceInfo = "🎉 Creating a new liquidity pool!\n";
    }

    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 1200;

    let txResponse;

    if (isETHInvolved) {
      // Approve token A first (if using ETH, we only need to approve the token)
      const allowance = await tokenAContract.allowance(
        fromAddress,
        ROUTER_ADDRESS,
      );
      if (allowance < amountAWei) {
        const approveTx = await tokenAContract
          .connect(wallet)
          .approve(ROUTER_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }

      // Add liquidity with ETH
      txResponse = await routerWithSigner.addLiquidityETH(
        tokenAAddress,
        amountAWei,
        amountAMin,
        amountBMin,
        fromAddress,
        deadline,
        { value: amountBWei },
      );
    } else {
      // Approve both tokens
      const allowanceA = await tokenAContract.allowance(
        fromAddress,
        ROUTER_ADDRESS,
      );
      if (allowanceA < amountAWei) {
        const approveTxA = await tokenAContract
          .connect(wallet)
          .approve(ROUTER_ADDRESS, ethers.MaxUint256);
        await approveTxA.wait();
      }

      const allowanceB = await tokenBContract.allowance(
        fromAddress,
        ROUTER_ADDRESS,
      );
      if (allowanceB < amountBWei) {
        const approveTxB = await tokenBContract
          .connect(wallet)
          .approve(ROUTER_ADDRESS, ethers.MaxUint256);
        await approveTxB.wait();
      }

      // Add liquidity for token-token pair
      txResponse = await routerWithSigner.addLiquidity(
        tokenAAddress,
        tokenBAddress,
        amountAWei,
        amountBWei,
        amountAMin,
        amountBMin,
        fromAddress,
        deadline,
      );
    }

    return (
      `⏳ Adding Liquidity Transaction Sent\n` +
      `Pair: ${tokenASymbol}-${tokenBSymbol}\n` +
      `Amount A: ${amountA} ${tokenASymbol}\n` +
      `Amount B: ${amountB} ${tokenBSymbol}\n` +
      `${priceInfo}` +
      `Slippage Protection: ${slippage}%\n` +
      `Transaction Hash: ${txResponse.hash}\n` +
      `🔍 Check blockchain explorer for confirmation`
    );
  } catch (error) {
    console.error("Error adding liquidity to PancakeSwap:", error.message);
    throw error;
  }
}

export default addPancakeSwapLiquidity;
