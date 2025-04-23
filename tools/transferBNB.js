import { ethers } from "ethers";

async function transferBNB({ fromPrivateKey, toAddress, amount }) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Create wallet from private key
    const wallet = new ethers.Wallet(fromPrivateKey, provider);
    const fromAddress = wallet.address;

    // Validate the recipient address
    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid recipient address");
    }

    // Check sender's balance
    const balance = await provider.getBalance(fromAddress);
    const balanceFormatted = ethers.formatEther(balance);

    // Convert amount to Wei
    const amountWei = ethers.parseEther(amount.toString());

    // Check if user has enough balance (including some for gas)
    const estimatedGas = await provider.estimateGas({
      from: fromAddress,
      to: toAddress,
      value: amountWei,
    });

    const gasPrice = await provider.getFeeData();
    const gasCost = estimatedGas * gasPrice.gasPrice;

    if (balance < amountWei + gasCost) {
      throw new Error(
        `Insufficient balance. You have ${balanceFormatted} BNB, but trying to send ${amount} BNB plus gas costs.`,
      );
    }

    // Execute the transfer
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountWei,
    });

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();

    return (
      `✅ BNB Transfer Successful\n` +
      `Amount: ${amount} BNB\n` +
      `From: ${fromAddress}\n` +
      `To: ${toAddress}\n` +
      `Transaction Hash: ${receipt.hash}\n` +
      `Block: ${receipt.blockNumber}\n` +
      `Status: Confirmed\n` +
      `⚙️ Gas Used: ${receipt.gasUsed.toString()}\n` +
      `🔍 View on Explorer: https://bscscan.com/tx/${receipt.hash}`
    );
  } catch (error) {
    console.error("Error transferring BNB:", error.message);
    return `❌ BNB Transfer Failed: ${error.message}`;
  }
}

export default transferBNB;
