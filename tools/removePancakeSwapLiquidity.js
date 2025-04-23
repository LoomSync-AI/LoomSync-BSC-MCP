import { ethers } from "ethers";

// PancakeSwap Router address
const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
// PancakeSwap Factory address
const FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
// WBNB address on BSC
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
// Native BNB special address
const NATIVE_BNB_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// PancakeSwap Router ABI (only liquidity removal functions)
const ROUTER_ABI = [
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)",
  "function factory() external pure returns (address)",
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
  "function totalSupply() view returns (uint256)",
];

// LP Token ABI (extends ERC20)
const LP_TOKEN_ABI = [
  ...ERC20_ABI,
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
];

async function removePancakeSwapLiquidity({
  fromPrivateKey,
  tokenAAddress,
  tokenBAddress,
  liquidity,
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
      isETHInvolved = true;
    } else if (
      tokenBAddress.toLowerCase() === NATIVE_BNB_ADDRESS.toLowerCase()
    ) {
      isETHInvolved = true;
    }

    // Get the actual tokens for pair (use WBNB for native BNB)
    const actualTokenA = tokenAAddress;
    const actualTokenB = isETHInvolved ? WBNB_ADDRESS : tokenBAddress;

    // Create contract instances
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
    const routerWithSigner = router.connect(wallet);
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

    // Get the LP token (pair) address
    const pairAddress = await factory.getPair(actualTokenA, actualTokenB);

    if (pairAddress === ethers.ZeroAddress) {
      throw new Error("Liquidity pair does not exist for these tokens");
    }

    // Create LP token contract instance
    const lpToken = new ethers.Contract(pairAddress, LP_TOKEN_ABI, provider);

    // Get token information
    const tokenAContract = new ethers.Contract(
      tokenAAddress,
      ERC20_ABI,
      provider,
    );
    const tokenASymbol = await tokenAContract.symbol();
    const tokenADecimals = await tokenAContract.decimals();

    let tokenBSymbol, tokenBDecimals;
    if (isETHInvolved) {
      tokenBSymbol = "BNB";
      tokenBDecimals = 18;
    } else {
      const tokenBContract = new ethers.Contract(
        tokenBAddress,
        ERC20_ABI,
        provider,
      );
      tokenBSymbol = await tokenBContract.symbol();
      tokenBDecimals = await tokenBContract.decimals();
    }

    // Get the reserves and tokens in the correct order
    const reserves = await lpToken.getReserves();
    const token0 = await lpToken.token0();

    let reserveA, reserveB;
    if (token0.toLowerCase() === actualTokenA.toLowerCase()) {
      reserveA = reserves[0];
      reserveB = reserves[1];
    } else {
      reserveA = reserves[1];
      reserveB = reserves[0];
    }

    // Get the user's LP token balance
    const lpDecimals = await lpToken.decimals();
    const userLpBalance = await lpToken.balanceOf(fromAddress);
    const userLpBalanceFormatted = ethers.formatUnits(
      userLpBalance,
      lpDecimals,
    );

    // Calculate the percentage of the pool the user is removing
    const totalSupply = await lpToken.totalSupply();
    const percentageOfPool =
      (Number(userLpBalance) * 100) / Number(totalSupply);

    // Calculate the amount of LP tokens to remove
    let liquidityAmount;
    if (liquidity <= 100 && liquidity > 0) {
      // If liquidity is a percentage (1-100), calculate the actual amount
      liquidityAmount =
        (userLpBalance * BigInt(Math.floor(liquidity * 100))) / BigInt(10000);
    } else {
      // Otherwise, assume it's the exact amount
      liquidityAmount = ethers.parseUnits(liquidity.toString(), lpDecimals);

      // Check if user has enough LP tokens
      if (liquidityAmount > userLpBalance) {
        throw new Error(
          `Not enough LP tokens. You have ${userLpBalanceFormatted} LP tokens.`,
        );
      }
    }

    // Calculate the expected token amounts based on the percentage of LP tokens being removed
    const expectedAmountA = (reserveA * liquidityAmount) / totalSupply;
    const expectedAmountB = (reserveB * liquidityAmount) / totalSupply;

    // Format expected amounts
    const expectedAmountAFormatted = ethers.formatUnits(
      expectedAmountA,
      tokenADecimals,
    );
    const expectedAmountBFormatted = ethers.formatUnits(
      expectedAmountB,
      isETHInvolved ? 18 : tokenBDecimals,
    );

    // Calculate min amounts with slippage protection
    const amountAMin =
      expectedAmountA -
      (expectedAmountA * BigInt(Math.floor(slippage * 100))) / BigInt(10000);
    const amountBMin =
      expectedAmountB -
      (expectedAmountB * BigInt(Math.floor(slippage * 100))) / BigInt(10000);

    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 1200;

    // Check if LP token is approved for router
    const lpTokenWithSigner = lpToken.connect(wallet);
    const allowance = await lpTokenWithSigner.allowance(
      fromAddress,
      ROUTER_ADDRESS,
    );

    if (allowance < liquidityAmount) {
      // Approve LP token for router
      const approveTx = await lpTokenWithSigner.approve(
        ROUTER_ADDRESS,
        ethers.MaxUint256,
      );
      await approveTx.wait();
    }

    // Remove liquidity
    let txResponse;

    if (isETHInvolved) {
      // Remove liquidity with ETH
      txResponse = await routerWithSigner.removeLiquidityETH(
        tokenAAddress,
        liquidityAmount,
        amountAMin,
        amountBMin,
        fromAddress,
        deadline,
      );
    } else {
      // Remove liquidity for token-token pair
      txResponse = await routerWithSigner.removeLiquidity(
        tokenAAddress,
        tokenBAddress,
        liquidityAmount,
        amountAMin,
        amountBMin,
        fromAddress,
        deadline,
      );
    }

    // Calculate the percentage of LP tokens being removed
    const percentageBeingRemoved =
      (Number(liquidityAmount) * 100) / Number(userLpBalance);

    return (
      `⏳ Removing Liquidity Transaction Sent\n` +
      `Pair: ${tokenASymbol}-${tokenBSymbol}\n` +
      `LP Tokens Being Removed: ${ethers.formatUnits(liquidityAmount, lpDecimals)} (${percentageBeingRemoved.toFixed(2)}% of your position)\n` +
      `Expected Return:\n` +
      `- ${expectedAmountAFormatted} ${tokenASymbol}\n` +
      `- ${expectedAmountBFormatted} ${tokenBSymbol}\n` +
      `Pool Ownership: ${percentageOfPool.toFixed(4)}% of total pool\n` +
      `Slippage Protection: ${slippage}%\n` +
      `Transaction Hash: ${txResponse.hash}\n` +
      `🔍 Check blockchain explorer for confirmation`
    );
  } catch (error) {
    console.error("Error removing liquidity from PancakeSwap:", error.message);
    throw error;
  }
}

export default removePancakeSwapLiquidity;
