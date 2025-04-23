import { ethers } from "ethers";

// ERC20 Transfer event ABI
const transferEventABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

async function listenForTokenTransfers(
  tokenAddress,
  minValue = "0",
  duration = 300,
) {
  try {
    // Connect to the BSC network
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);

    const wsProvider = new ethers.WebSocketProvider(
      "wss://bsc-ws-node.nariox.org:443",
    );

    // Validate address
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid token address");
    }

    // Create token contract instances
    const tokenContract = new ethers.Contract(
      tokenAddress,
      transferEventABI,
      provider,
    );
    const wsTokenContract = new ethers.Contract(
      tokenAddress,
      transferEventABI,
      wsProvider,
    );

    // Get token details for better display
    const tokenABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ];
    const tokenDetails = new ethers.Contract(tokenAddress, tokenABI, provider);

    const [name, symbol, decimals] = await Promise.all([
      tokenDetails.name().catch(() => "Unknown Token"),
      tokenDetails.symbol().catch(() => "???"),
      tokenDetails.decimals().catch(() => 18),
    ]);

    // Convert minValue to raw amount based on decimals
    const minValueRaw = ethers.parseUnits(minValue, decimals);

    // Track transfers
    const transfers = [];

    // Set up event listener
    wsTokenContract.on("Transfer", (from, to, value, event) => {
      // Only show transfers above minimum value
      if (value >= minValueRaw) {
        const formattedValue = ethers.formatUnits(value, decimals);
        const timestamp = new Date().toLocaleTimeString();

        transfers.push({
          timestamp,
          from,
          to,
          value: formattedValue,
          symbol,
        });
      }
    });

    // Set timeout to stop listening after duration
    setTimeout(() => {
      wsTokenContract.removeAllListeners();
      wsProvider.destroy();
    }, duration * 1000);

    return `Started monitoring ${name} (${symbol}) transfers for ${duration} seconds. Minimum value: ${minValue} ${symbol}.`;
  } catch (error) {
    throw error;
  }
}

export default listenForTokenTransfers;
