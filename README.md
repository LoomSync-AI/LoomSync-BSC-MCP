# LoomSync-BSC-MCP

LoomSync-BSC-MCP is a multi-functional BSC (Binance Smart Chain) on-chain interaction and analysis platform based on Node.js, integrating wallet management, token query, on-chain transactions, PancakeSwap liquidity operations, and NFT metadata retrieval, suitable for developers and advanced users to perform in-depth operations and automation on the BSC ecosystem.

---

## Main Features 🚀
- **Wallet Management** 📈: Create wallets, query balances, and batch query token balances.
- **Token Operations** 📊: Query BEP-20 token balances, authorization amounts, prices, holders, and historical records.
- **On-Chain Transactions** 📈: BNB and BEP-20 token transfers, transaction listening, and batch operations.
- **Contract Interaction** 📝: Call any contract, estimate Gas, and listen for Token Transfer events.
- **PancakeSwap Integration** 🍰: Support token swaps, add/remove liquidity, and real-time price monitoring.
- **NFT Support** 🎨: Get NFT metadata.
- **Crypto News** 📰: Integrate crypto news and ETF fund flow data.

---

## Directory Structure 🗂️
```
├── index.js                # Main entry, register all tools and services
├── tools/                  # Various functional modules (e.g., wallet, transaction, PancakeSwap, NFT, etc.)
├── data/tokens.js          # Supported token list and metadata
├── .env.example            # Environment variable example
├── package.json            # Project dependencies and metadata
└── ...
```

---

## All Built-in Tools 🧰

The `tools/` directory contains all the modular features of LoomSync-BSC-MCP. Each file represents a specific blockchain or utility capability. Below is a complete list of available tools:

```text
addPancakeSwapLiquidity.js      # Add liquidity to PancakeSwap pools
batchQueryTokenBalances.js      # Batch query token balances for multiple wallets
callContract.js                 # Interact with any smart contract
createWallet.js                 # Create a new wallet
cryptoNews.js                   # Get the latest crypto news
estimateGas.js                  # Estimate gas for a transaction
getCryptoETFIncomeFlow.js       # Query ETF fund flow data
getGasPrice.js                  # Get current gas price
getNFTMetadata.js               # Retrieve NFT metadata
getTokenAddressFromName.js      # Get token contract address by name
getTokenHolders.js              # List holders of a token
getTokenMetadata.js             # Get token metadata
getTransactions.js              # Query transaction history
getWalletHistory.js             # Wallet transaction history
getWalletTokens.js              # List tokens held by a wallet
grokLLM.js                      # AI-powered content generation (e.g., for social media)
listenForTokenTransfers.js      # Listen for token transfer events
monitorTokenPrice.js            # Monitor real-time token price
queryBalance.js                 # Query wallet BNB balance
queryTokenAllowance.js          # Query token allowance
queryTokenBalance.js            # Query BEP-20 token balance
queryTokenPrice.js              # Query token price
removePancakeSwapLiquidity.js   # Remove liquidity from PancakeSwap pools
sendTransaction.js              # Send on-chain transactions
swapOnPancakeSwap.js            # Swap tokens on PancakeSwap
transferBNB.js                  # Transfer BNB
transferERC20.js                # Transfer BEP-20 tokens
waitForTransaction.js           # Wait for transaction confirmation
```

**Supplementary Notes:**
- Each tool is a standalone JavaScript module and can be used independently or combined in workflows.
- Tools cover wallet management, token operations, DeFi interactions, NFT support, analytics, and even AI-powered utilities.
- To use a tool, simply import it in your code (see feature examples below) or invoke via the MCP server interface.
- For detailed usage of each tool, please refer to the corresponding file in the `tools/` directory or ask for code samples.

---

## Installation & Running 🚀
1. **Clone the repository**
```bash
git clone https://github.com/CobraCn/bnb-mcp.git
cd bnb-mcp
```
2. **Install dependencies**
```bash
npm install
```
3. **Configure environment variables**
Copy `.env.example` to `.env` and fill in according to your situation:
```
CLAUDE_API_KEY=your_claude_key
BSCSCAN_API_KEY=your_bscscan_key
BSC_RPC_URL=your_bsc_rpc_url
DEEPSEEK_API_KEY=your_deepseek_key
```
4. **Start the service**
```bash
node index.js
```

---

## Dependencies 🛠️
- `ethers`: Interact with the BSC blockchain
- `@modelcontextprotocol/sdk`: MCP protocol service
- `axios`, `node-fetch`: HTTP requests
- `dotenv`: Environment variable management
- `openai`, `@langchain/*`: AI capabilities
- `node-telegram-bot-api`: Telegram Bot support
- See more in `package.json`

---

## Main Features & Examples 🚀
- **Create Wallet**
```js
const wallet = await createWallet();
```
- **Query Wallet Balance**
```js
const balance = await queryBalance({ walletAddress: '0x...' });
```
- **Token Swap (PancakeSwap)**
```js
const result = await swapOnPancakeSwap({ ... });
```
- **Add Liquidity**
```js
const result = await addPancakeSwapLiquidity({ ... });
```
- **Listen for Token Transfers**
```js
const log = await listenForTokenTransfers({ ... });
```

---

## Use Cases 💡
- Web3 application development, automation scripts, on-chain data analytics, DeFi/NFT interaction, wallet management, and more.

---

## Contributing & Feedback 🤝
We welcome Issues and PRs! See the [GitHub Project Page](https://github.com/CobraCn/bnb-mcp).

---

## License 📄
ISC

---

## Follow Us on Twitter 🐦
Stay updated with the latest features, news, and tips:
- [@LoomSyncAI](https://twitter.com/LoomSyncAI)
- [@CobraCn](https://twitter.com/CobraCn)
