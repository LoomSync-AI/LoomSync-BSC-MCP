import { ethers } from "ethers";

// BSC Chain ID
const CHAIN_ID = 56;
// PancakeSwap Router address
const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
// Native BNB address for UniswapV2 router
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
// For handling native BNB in swaps
const NATIVE_BNB_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// PancakeSwap Router ABI (only the functions we need)
const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
];

// ERC20 Token ABI (for approvals and balance checking)
const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
];

async function swapOnUniswapV2({
  fromPrivateKey,
  fromTokenAddress,
  toTokenAddress,
  amount,
  slippage = 1,
}) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Create wallet from private key
    const wallet = new ethers.Wallet(fromPrivateKey, provider);
    const fromAddress = wallet.address;

    // Validate addresses
    if (
      !ethers.isAddress(fromTokenAddress) ||
      !ethers.isAddress(toTokenAddress)
    ) {
      throw new Error("Invalid token address provided");
    }

    // Handle native BNB special cases
    const isFromNative =
      fromTokenAddress.toLowerCase() === NATIVE_BNB_ADDRESS.toLowerCase();
    const isToNative =
      toTokenAddress.toLowerCase() === NATIVE_BNB_ADDRESS.toLowerCase();

    // Use WBNB for the actual swap if native BNB is involved
    const actualFromToken = isFromNative ? WBNB_ADDRESS : fromTokenAddress;
    const actualToToken = isToNative ? WBNB_ADDRESS : toTokenAddress;

    // Get token information and format amount based on token decimals
    let fromTokenSymbol, toTokenSymbol, decimals, amountWei;

    if (isFromNative) {
      fromTokenSymbol = "BNB";
      decimals = 18;
      amountWei = ethers.parseEther(amount.toString());
    } else {
      const tokenContract = new ethers.Contract(
        fromTokenAddress,
        ERC20_ABI,
        provider,
      );
      decimals = await tokenContract.decimals();
      fromTokenSymbol = await tokenContract.symbol();
      amountWei = ethers.parseUnits(amount.toString(), decimals);
    }

    if (isToNative) {
      toTokenSymbol = "BNB";
    } else {
      const tokenContract = new ethers.Contract(
        toTokenAddress,
        ERC20_ABI,
        provider,
      );
      toTokenSymbol = await tokenContract.symbol();
    }

    // Create router instance
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);

    // Create the token path for the swap
    const path = [actualFromToken, actualToToken];

    // If the path doesn't include WBNB and the tokens aren't directly paired,
    // use WBNB as an intermediary
    if (actualFromToken !== WBNB_ADDRESS && actualToToken !== WBNB_ADDRESS) {
      try {
        // Try direct path first
        await router.getAmountsOut(amountWei, path);
      } catch (error) {
        // If direct path fails, use WBNB as intermediary
        path.splice(1, 0, WBNB_ADDRESS);
      }
    }

    // Get expected output amount
    const amounts = await router.getAmountsOut(amountWei, path);
    const expectedOutput = amounts[amounts.length - 1];

    // Calculate minimum output amount with slippage
    const minOutput =
      expectedOutput -
      (expectedOutput * BigInt(Math.floor(slippage * 100))) / BigInt(10000);

    // Calculate human-readable amounts for the output
    const toTokenDecimals = isToNative
      ? 18
      : await new ethers.Contract(
          toTokenAddress,
          ERC20_ABI,
          provider,
        ).decimals();
    const expectedOutputFormatted = ethers.formatUnits(
      expectedOutput,
      toTokenDecimals,
    );

    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 1200;

    let txResponse;

    // Execute the appropriate swap function based on token types
    if (isFromNative) {
      // Swap BNB for Tokens
      const routerWithSigner = router.connect(wallet);
      txResponse = await routerWithSigner.swapExactETHForTokens(
        minOutput,
        path,
        fromAddress,
        deadline,
        { value: amountWei },
      );
    } else if (isToNative) {
      // Swap Tokens for BNB
      const tokenContract = new ethers.Contract(
        fromTokenAddress,
        ERC20_ABI,
        wallet,
      );

      // Check allowance and approve if needed
      const allowance = await tokenContract.allowance(
        fromAddress,
        ROUTER_ADDRESS,
      );
      if (allowance < amountWei) {
        const approveTx = await tokenContract.approve(
          ROUTER_ADDRESS,
          ethers.MaxUint256,
        );
        await approveTx.wait();
      }

      const routerWithSigner = router.connect(wallet);
      txResponse = await routerWithSigner.swapExactTokensForETH(
        amountWei,
        minOutput,
        path,
        fromAddress,
        deadline,
      );
    } else {
      // Swap Tokens for Tokens
      const tokenContract = new ethers.Contract(
        fromTokenAddress,
        ERC20_ABI,
        wallet,
      );

      // Check allowance and approve if needed
      const allowance = await tokenContract.allowance(
        fromAddress,
        ROUTER_ADDRESS,
      );
      if (allowance < amountWei) {
        const approveTx = await tokenContract.approve(
          ROUTER_ADDRESS,
          ethers.MaxUint256,
        );
        await approveTx.wait();
      }

      const routerWithSigner = router.connect(wallet);
      txResponse = await routerWithSigner.swapExactTokensForTokens(
        amountWei,
        minOutput,
        path,
        fromAddress,
        deadline,
      );
    }

    // Format the response
    return (
      `⏳ Swap Transaction Sent\n` +
      `From: ${amount} ${fromTokenSymbol}\n` +
      `To: ~${expectedOutputFormatted} ${toTokenSymbol}\n` +
      `Slippage Protection: ${slippage}%\n` +
      `Router: PancakeSwap (${ROUTER_ADDRESS})\n` +
      `Transaction Hash: ${txResponse.hash}\n` +
      `🔍 Check blockchain explorer for confirmation`
    );
  } catch (error) {
    console.error("Error swapping on PancakeSwap:", error.message);
    throw error;
  }
}

export default swapOnUniswapV2;
