import { ethers } from "ethers";

async function sendTransaction({ fromPrivateKey, toAddress, amount }) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Create wallet from private key
    const wallet = new ethers.Wallet(fromPrivateKey, provider);

    // Validate the address
    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid recipient address");
    }

    // Convert amount to Wei
    const amountInWei = ethers.parseEther(amount.toString());

    // Send transaction
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountInWei,
    });

    return `⏳ Pending\n💸 Successfully sent ${amount} BNB\nFrom: ${wallet.address}\nTo: ${toAddress}\nAmount: ${amount}\nTransaction Hash: ${tx.hash}\n🔍 Check blockchain explorer for confirmation`;
  } catch (error) {
    console.error("Error sending transaction:", error.message);
    throw error;
  }
}

export default sendTransaction;
