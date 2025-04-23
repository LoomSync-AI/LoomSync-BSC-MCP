import { ethers } from "ethers";
import axios from "axios";

// ERC721 ABI for NFT metadata
const nftABI = [
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
];

async function getNFTMetadata(nftAddress, tokenId) {
  try {
    // Connect to the BSC network
    const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);

    // Validate address
    if (!ethers.isAddress(nftAddress)) {
      throw new Error("Invalid NFT contract address");
    }

    // Create NFT contract instance
    const nftContract = new ethers.Contract(nftAddress, nftABI, provider);

    // Get basic NFT information
    const [name, symbol, tokenURI, owner] = await Promise.all([
      nftContract.name().catch(() => "Unknown Collection"),
      nftContract.symbol().catch(() => "???"),
      nftContract.tokenURI(tokenId).catch(() => ""),
      nftContract.ownerOf(tokenId).catch(() => ""),
    ]);
    // If we couldn't get the owner, the token might not exist
    if (!owner) {
      throw new Error(
        `Token ID ${tokenId} does not exist in collection ${nftAddress}`,
      );
    }

    let metadata;
    if (tokenURI) {
      try {
        const response = await fetch(tokenURI);
        const data = await response.json();
        metadata = data;
      } catch (error) {
        console.error(
          `Failed to fetch metadata from tokenURI: ${tokenURI}`,
          error,
        );
        metadata = null; // Set metadata to null if fetching fails
      }
    }

    // const result = {
    //   name,
    //   symbol,
    //   owner,
    //   tokenURI,
    //   formattedOutput: `\u2705 NFT Metadata\nCollection: ${name} (${symbol})\nToken ID: ${tokenId}\nOwner: ${owner}\nToken URI: ${tokenURI}\n`,
    // };

    // console.log(metadata)
    // const result = `nft name:${metadata.name}, nft description: ${metadata.description}, nft image: ${metadata.image},nft website: ${metadata.external_url}`
    const result = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      website: metadata.external_url
    }

    return JSON.stringify(result)
  } catch (error) {
    throw error;
  }
}

export default getNFTMetadata;

// getNFTMetadata("0xd660a598E95bcD9e35AD8651604E51cee73C1228", 1)
