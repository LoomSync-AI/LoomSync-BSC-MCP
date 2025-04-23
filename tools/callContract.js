import { ethers } from "ethers";

async function callContract({
  contractAddress,
  abi,
  methodName,
  params = [],
  privateKey = null,
  value = "0",
}) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);


    // Validate contract address
    if (!ethers.isAddress(contractAddress)) {
      throw new Error("Invalid contract address");
    }

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Check if method exists
    if (!contract[methodName]) {
      throw new Error(`Method ${methodName} not found in contract ABI`);
    }

    // Determine if it's a read or write operation
    const isWriteOperation = privateKey !== null;

    if (isWriteOperation) {
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey, provider);
      const contractWithSigner = contract.connect(wallet);

      // Send transaction
      const tx = await contractWithSigner[methodName](...params, {
        value: ethers.parseEther(value),
      });

      return `⏳ Pending\nOperation: write\n📝 Contract function executed\nContract: ${contractAddress}\nFunction: ${methodName}\nTransaction Hash: ${tx.hash}\n🔍 Check blockchain explorer for confirmation`;
    } else {
      // Call read-only function
      const result = await contract[methodName](...params);

      // Convert result to string representation
      const resultString =
        typeof result === "object"
          ? JSON.stringify(result, null, 2)
          : String(result);

      return `✅ Success\nOperation: read\n🔍 Contract function called\nContract: ${contractAddress}\nFunction: ${methodName}\nResult: ${resultString}`;
    }
  } catch (error) {
    console.error("Error interacting with contract:", error.message);
    throw error;
  }
}

export default callContract;
