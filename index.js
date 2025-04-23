import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import createWallet from "./tools/createWallet.js";
import queryBalance from "./tools/queryBalance.js";
import sendTransaction from "./tools/sendTransaction.js";
import getTransactions from "./tools/getTransactions.js";
import queryTokenBalance from "./tools/queryTokenBalance.js";
import queryTokenAllowance from "./tools/queryTokenAllowance.js";
import queryTokenPrice from "./tools/queryTokenPrice.js";
import callContract from "./tools/callContract.js";
import swapOnUniswapV2 from "./tools/swapOnPancakeSwap.js";
import addPancakeSwapLiquidity from "./tools/addPancakeSwapLiquidity.js";
import removePancakeSwapLiquidity from "./tools/removePancakeSwapLiquidity.js";
import transferERC20 from "./tools/transferERC20.js";
import transferBNB from "./tools/transferBNB.js";

// Import new tools
// import getTokenMetadata from "./tools/getTokenMetadata.js";
import estimateGas from "./tools/estimateGas.js";
import monitorTokenPrice from "./tools/monitorTokenPrice.js";
import getGasPrice from "./tools/getGasPrice.js";
import listenForTokenTransfers from "./tools/listenForTokenTransfers.js";
import batchQueryTokenBalances from "./tools/batchQueryTokenBalances.js";
import getNFTMetadata from "./tools/getNFTMetadata.js";
import waitForTransaction from "./tools/waitForTransaction.js";
import getWalletTokens from "./tools/getWalletTokens.js";
import getTokenHolders from "./tools/getTokenHolders.js";
import getWalletHistory from "./tools/getWalletHistory.js";
import getCryptoNews from "./tools/cryptoNews.js";
import getCryptoETFIncomeFlow from "./tools/getCryptoETFIncomeFlow.js";
import getTokenAddressFromName from "./tools/getTokenAddressFromName.js";

// Create MCP server
const server = new McpServer({
  name: "bnb-chain-mcp",
  version: "1.0.0",
});

server.tool(
  "crypto_news",
  "Get latest crypto news",
  async () => {
    const result = await getCryptoNews()
    return {
      content: [{
        type: "text",
        text: result
      }]
    }
  }
);

server.tool(
  "get_token_address_from_name",
  "Get BEP-20 token address from token name",
  {
    tokenName: z.string().describe("Name of the BEP-20 token"),
  },

  async ({ tokenName }) => {
    const result = await getTokenAddressFromName(tokenName)
    return {
      content: [{
        type: "text",
        text: result
      }]
    }
  }
)

server.tool(
  "get_crypto_etf_income_flow",
  "Get crypto ETF income flow",
  async () => {
    const result = await getCryptoETFIncomeFlow()
    return {
      content: [{
        type: "text",
        text: result
      }]
    }
  }
);

server.tool(
  "create_wallet",
  "Creates a new wallet on BSC Chain with address and private key",
  async () => {
    const result = createWallet();

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "query_balance",
  "Query user's BNB balance on BSC Chain",
  {
    walletAddress: z.string().describe("Wallet address to query balance"),
  },
  async ({ walletAddress }) => {
    const result = await queryBalance(walletAddress);

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "send_transaction",
  "Send BNB transactions between wallets on BSC Chain",
  {
    fromPrivateKey: z.string().describe("Sender's wallet private key"),
    toAddress: z.string().describe("Recipient's wallet address"),
    amount: z.number().describe("Transfer amount (BNB)"),
  },
  async ({ fromPrivateKey, toAddress, amount }) => {
    const result = await sendTransaction({ fromPrivateKey, toAddress, amount });
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "get_transactions",
  "Retrieve transaction history for a wallet on BSC Chain",
  {
    address: z.string().describe("Wallet address to query transaction history"),
    limit: z
      .number()
      .optional()
      .describe("Limit on the number of transactions returned (default is 10)"),
  },
  async ({ address, limit }) => {
    const result = await getTransactions(address, limit);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "query_token_balance",
  "Query BEP-20 token balance for a wallet on BSC Chain",
  {
    walletAddress: z.string().describe("Wallet address to query token balance"),
    tokenAddress: z.string().describe("Token contract address"),
  },
  async ({ walletAddress, tokenAddress }) => {
    const result = await queryTokenBalance(walletAddress, tokenAddress);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "query_token_allowance",
  "Query ERC20/BEP-20 token allowance (approved spending limit) on BSC Chain",
  {
    ownerAddress: z.string().describe("Token owner's wallet address"),
    spenderAddress: z
      .string()
      .describe("Spender's wallet address (typically a contract)"),
    tokenAddress: z.string().describe("Token contract address"),
  },
  async ({ ownerAddress, spenderAddress, tokenAddress }) => {
    const result = await queryTokenAllowance(
      ownerAddress,
      spenderAddress,
      tokenAddress,
    );
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "query_token_price",
  "Query current price of any BEP-20 token on BSC Chain using PancakeSwap",
  {
    tokenAddress: z
      .string()
      .describe(
        "Token contract address (use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native BNB)",
      ),
  },
  async ({ tokenAddress }) => {
    const result = await queryTokenPrice(tokenAddress);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "transfer_bnb",
  "Transfer native BNB from one wallet to another on BSC Chain",
  {
    fromPrivateKey: z
      .string()
      .describe("Private key of the wallet to send BNB from"),
    toAddress: z.string().describe("Recipient wallet address"),
    amount: z.number().describe("Amount of BNB to send (in BNB, not wei)"),
  },
  async ({ fromPrivateKey, toAddress, amount }) => {
    const result = await transferBNB({
      fromPrivateKey,
      toAddress,
      amount,
    });
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "transfer_erc20",
  "Transfer any BEP-20 token from one wallet to another on BSC Chain",
  {
    fromPrivateKey: z
      .string()
      .describe("Private key of the wallet to send tokens from"),
    tokenAddress: z.string().describe("Token contract address"),
    toAddress: z.string().describe("Recipient wallet address"),
    amount: z
      .number()
      .describe("Amount of tokens to send (in token units, not wei)"),
  },
  async ({ fromPrivateKey, tokenAddress, toAddress, amount }) => {
    const result = await transferERC20({
      fromPrivateKey,
      tokenAddress,
      toAddress,
      amount,
    });
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "swap_pancakeswap",
  "Swap tokens on BSC Chain using PancakeSwap (UniswapV2 fork)",
  {
    fromPrivateKey: z
      .string()
      .describe("Private key of the wallet to swap from"),
    fromTokenAddress: z
      .string()
      .describe(
        "Address of the token to swap from (use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native BNB)",
      ),
    toTokenAddress: z.string().describe("Address of the token to swap to"),
    amount: z.number().describe("Amount to swap (in token units, not wei)"),
    slippage: z
      .number()
      .optional()
      .describe("Maximum allowed slippage in percentage (default: 1)"),
  },
  async ({
    fromPrivateKey,
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage,
  }) => {
    const result = await swapOnUniswapV2({
      fromPrivateKey,
      fromTokenAddress,
      toTokenAddress,
      amount,
      slippage,
    });
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "add_pancakeswap_liquidity",
  "Add liquidity to PancakeSwap V2 pools on BSC Chain",
  {
    fromPrivateKey: z
      .string()
      .describe("Private key of the wallet to provide liquidity from"),
    tokenAAddress: z
      .string()
      .describe(
        "Address of the first token (use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native BNB)",
      ),
    tokenBAddress: z
      .string()
      .describe(
        "Address of the second token (use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native BNB)",
      ),
    amountA: z
      .number()
      .describe("Amount of first token to add (in token units, not wei)"),
    amountB: z
      .number()
      .describe("Amount of second token to add (in token units, not wei)"),
    slippage: z
      .number()
      .optional()
      .describe("Maximum allowed slippage in percentage (default: 1)"),
  },
  async ({
    fromPrivateKey,
    tokenAAddress,
    tokenBAddress,
    amountA,
    amountB,
    slippage,
  }) => {
    const result = await addPancakeSwapLiquidity({
      fromPrivateKey,
      tokenAAddress,
      tokenBAddress,
      amountA,
      amountB,
      slippage,
    });
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "remove_pancakeswap_liquidity",
  "Remove liquidity from PancakeSwap V2 pools on BSC Chain",
  {
    fromPrivateKey: z
      .string()
      .describe("Private key of the wallet that owns the LP tokens"),
    tokenAAddress: z
      .string()
      .describe(
        "Address of the first token in the pair (use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native BNB)",
      ),
    tokenBAddress: z
      .string()
      .describe(
        "Address of the second token in the pair (use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native BNB)",
      ),
    liquidity: z
      .number()
      .describe(
        "Amount of LP tokens to remove (if <= 100, treated as percentage of your LP tokens)",
      ),
    slippage: z
      .number()
      .optional()
      .describe("Maximum allowed slippage in percentage (default: 1)"),
  },
  async ({
    fromPrivateKey,
    tokenAAddress,
    tokenBAddress,
    liquidity,
    slippage,
  }) => {
    const result = await removePancakeSwapLiquidity({
      fromPrivateKey,
      tokenAAddress,
      tokenBAddress,
      liquidity,
      slippage,
    });
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "call_contract",
  "Interact with smart contracts on BSC Chain for both read and write operations",
  {
    contractAddress: z.string().describe("Smart contract address"),
    abi: z.array(z.any()).describe("Contract ABI"),
    methodName: z.string().describe("Method name to call"),
    params: z
      .array(z.any())
      .optional()
      .describe("Array of parameters for the method"),
    privateKey: z
      .string()
      .optional()
      .describe("Private key for write operations"),
    value: z.string().optional().describe("Transfer amount (BNB)"),
  },
  async ({ contractAddress, abi, methodName, params, privateKey, value }) => {
    const result = await callContract({
      contractAddress,
      abi,
      methodName,
      params,
      privateKey,
      value,
    });
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

// server.tool(
//   "get_token_metadata",
//   "Get metadata for a BEP-20 token including name, symbol, decimals, and total supply",
//   {
//     tokenAddress: z.string().describe("Token contract address"),
//   },
//   async ({ tokenAddress }) => {
//     const result = await getTokenMetadata(tokenAddress);
//     return {
//       content: [
//         {
//           type: "text",
//           text: result.formattedOutput,
//         },
//       ],
//     };
//   },
// );

server.tool(
  "estimate_gas",
  "Estimate gas cost for a transaction on BSC Chain",
  {
    fromAddress: z.string().describe("Sender's wallet address"),
    toAddress: z.string().describe("Recipient's wallet address"),
    data: z.string().optional().describe("Transaction data in hex format"),
    value: z.string().optional().describe("Amount of BNB to send"),
  },
  async ({ fromAddress, toAddress, data, value }) => {
    const result = await estimateGas(fromAddress, toAddress, data, value);
    return {
      content: [
        {
          type: "text",
          text: result.formattedOutput,
        },
      ],
    };
  },
);

server.tool(
  "monitor_token_price",
  "Monitor token price in real-time on PancakeSwap",
  {
    tokenAddress: z.string().describe("Token contract address"),
    interval: z
      .number()
      .optional()
      .describe("Check interval in seconds (default: 60)"),
    duration: z
      .number()
      .optional()
      .describe("Total monitoring duration in seconds (default: 300)"),
  },
  async ({ tokenAddress, interval, duration }) => {
    const result = await monitorTokenPrice(tokenAddress, interval, duration);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "get_gas_price",
  "Get current gas prices on BSC Chain",
  {},
  async () => {
    const result = await getGasPrice();
    return {
      content: [
        {
          type: "text",
          text: result.formattedOutput,
        },
      ],
    };
  },
);

server.tool(
  "listen_for_token_transfers",
  "Listen for token transfer events in real-time",
  {
    tokenAddress: z.string().describe("Token contract address"),
    minValue: z
      .string()
      .optional()
      .describe("Minimum transfer value to monitor (default: 0)"),
    duration: z
      .number()
      .optional()
      .describe("Monitoring duration in seconds (default: 300)"),
  },
  async ({ tokenAddress, minValue, duration }) => {
    const result = await listenForTokenTransfers(
      tokenAddress,
      minValue,
      duration,
    );
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "batch_query_token_balances",
  "Query multiple token balances for a wallet in a single call",
  {
    walletAddress: z
      .string()
      .describe("Wallet address to query token balances"),
    tokenAddresses: z
      .array(z.string())
      .describe("Array of token contract addresses"),
  },
  async ({ walletAddress, tokenAddresses }) => {
    const result = await batchQueryTokenBalances(walletAddress, tokenAddresses);
    return {
      content: [
        {
          type: "text",
          text: result.formattedOutput,
        },
      ],
    };
  },
);

server.tool(
  "get_nft_metadata",
  "Retrieve the NFT's name, description, image, and website.",
  {
    nftAddress: z.string().describe("NFT contract address"),
    tokenId: z.number().describe("Token ID of the NFT"),
  },
  async ({ nftAddress, tokenId }) => {
    const result = await getNFTMetadata(nftAddress, tokenId);
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  },
);

server.tool(
  "wait_for_transaction",
  "Wait for a transaction to be confirmed on BSC Chain",
  {
    txHash: z.string().describe("Transaction hash to monitor"),
    confirmations: z
      .number()
      .optional()
      .describe("Number of confirmations to wait for (default: 1)"),
  },
  async ({ txHash, confirmations }) => {
    const result = await waitForTransaction(txHash, confirmations);
    return {
      content: [
        {
          type: "text",
          text: result.formattedOutput,
        },
      ],
    };
  },
);

server.tool(
  "get_wallet_tokens",
  "Get all tokens held by a wallet on BSC Chain",
  {
    walletAddress: z.string().describe("Wallet address to query tokens"),
  },
  async ({ walletAddress }) => {
    const result = await getWalletTokens(walletAddress);
    return {
      content: [
        {
          type: "text",
          text: result.formattedOutput,
        },
      ],
    };
  },
);

server.tool(
  "get_token_holders",
  "Get top holders of a specific token on BSC Chain",
  {
    tokenAddress: z.string().describe("Token contract address"),
    limit: z
      .number()
      .optional()
      .describe("Number of holders to return (default: 20)"),
  },
  async ({ tokenAddress, limit }) => {
    const result = await getTokenHolders(tokenAddress, limit);
    return {
      content: [
        {
          type: "text",
          text: result.formattedOutput,
        },
      ],
    };
  },
);

server.tool(
  "get_wallet_history",
  "Get transaction history for a wallet on BSC Chain",
  {
    walletAddress: z.string().describe("Wallet address to query history"),
    limit: z
      .number()
      .optional()
      .describe("Number of transactions to return (default: 20)"),
  },
  async ({ walletAddress, limit }) => {
    const result = await getWalletHistory(walletAddress, limit);
    return {
      content: [
        {
          type: "text",
          text: result.formattedOutput,
        },
      ],
    };
  },
);

// Start the server
async function main() {
  try {
    // Use standard input/output as the transport method
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main();