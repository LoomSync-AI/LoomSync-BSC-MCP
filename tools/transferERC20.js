import { ethers } from "ethers";

// ERC20 Token ABI (only the functions we need)
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

async function transferERC20({
  fromPrivateKey,
  tokenAddress,
  toAddress,
  amount,
}) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Create wallet from private key
    const wallet = new ethers.Wallet(fromPrivateKey, provider);
    const fromAddress = wallet.address;

    // Validate addresses
    if (!ethers.isAddress(toAddress) || !ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid address provided");
    }

    // Create token contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider,
    );
    const tokenWithSigner = tokenContract.connect(wallet);

    // Get token info
    const tokenSymbol = await tokenContract.symbol();
    const tokenName = await tokenContract.name();
    const decimals = await tokenContract.decimals();

    // Check sender's balance
    const balance = await tokenContract.balanceOf(fromAddress);
    const balanceFormatted = ethers.formatUnits(balance, decimals);

    // Format amount with correct decimals
    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    // Check if user has enough balance
    if (balance < amountWei) {
      throw new Error(
        `Insufficient balance. You have ${balanceFormatted} ${tokenSymbol}, but trying to send ${amount} ${tokenSymbol}`,
      );
    }

    // Execute the transfer
    const tx = await tokenWithSigner.transfer(toAddress, amountWei);

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();

    return (
      `✅ ERC20 Token Transfer Successful\n` +
      `Token: ${tokenName} (${tokenSymbol})\n` +
      `Amount: ${amount} ${tokenSymbol}\n` +
      `From: ${fromAddress}\n` +
      `To: ${toAddress}\n` +
      `Transaction Hash: ${receipt.hash}\n` +
      `Block: ${receipt.blockNumber}\n` +
      `Status: Confirmed\n` +
      `⚙️ Gas Used: ${receipt.gasUsed.toString()}\n` +
      `🔍 View on Explorer: https://bscscan.com/tx/${receipt.hash}`
    );
  } catch (error) {
    console.error("Error transferring ERC20 token:", error.message);
    return `❌ ERC20 Token Transfer Failed: ${error.message}`;
  }
}

export default transferERC20;
