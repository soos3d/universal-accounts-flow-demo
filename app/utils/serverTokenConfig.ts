// Server-side token configuration using environment variables

// Define the chain information
export interface ChainInfo {
  id: number;
  name: string;
  color: string;
  icon?: string;
}

// Token types for multi-token support
export type TokenType = "USDT" | "USDC";

// Token metadata
export interface TokenMetadata {
  symbol: string;
  name: string;
  image: string;
  color: string;
}

// Map of token metadata
export const TOKEN_METADATA: Record<TokenType, TokenMetadata> = {
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    image: "/tokens/usdt.png",
    color: "green-400",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    image: "/tokens/usdc.png",
    color: "blue-400",
  },
};

// Define the asset item structure
export interface AssetItem {
  chain: ChainInfo;
  symbol: string;
  tokenType: TokenType;
  balance: string;
  balanceUSD: string;
  tokenAddress: string;
  tokenImage: string;
}

// ERC20 ABI for token balance checking
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

// Helper function to get RPC URL from environment variables
function getRpcUrl(chainId: number): string {
  const envVar = `RPC_URL_${chainId}`;
  const rpcUrl = process.env[envVar];
  
  if (!rpcUrl) {
    console.warn(`No RPC URL found for chain ID ${chainId} in environment variables (${envVar})`);
    return "";
  }
  
  return rpcUrl;
}

// Supported tokens contract addresses by chain with RPC URLs
// USDT token addresses
export const USDT_TOKENS: Record<
  number,
  { chain: ChainInfo; tokenAddress: string; rpcUrl: string }
> = {
  1: {
    chain: { id: 1, name: "Ethereum", color: "blue", icon: "/chains/ethereum.png" },
    tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    rpcUrl: getRpcUrl(1),
  },
  56: {
    chain: {
      id: 56,
      name: "BNB Chain",
      color: "yellow",
      icon: "/chains/bnb.png",
    },
    tokenAddress: "0x55d398326f99059fF775485246999027B3197955",
    rpcUrl: getRpcUrl(56),
  },
  42161: {
    chain: { id: 42161, name: "Arbitrum One", color: "blue", icon: "/chains/arbitrum.png" },
    tokenAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    rpcUrl: getRpcUrl(42161),
  },
  10: {
    chain: { id: 10, name: "Optimism", color: "red", icon: "/chains/optimism.png" },
    tokenAddress: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    rpcUrl: getRpcUrl(10),
  },
  137: {
    chain: { id: 137, name: "Polygon", color: "purple", icon: "/chains/polygon.png" },
    tokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    rpcUrl: getRpcUrl(137),
  },
  43114: {
    chain: { id: 43114, name: "Avalanche", color: "red", icon: "/chains/avalanche.png" },
    tokenAddress: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    rpcUrl: getRpcUrl(43114),
  },
  59144: {
    chain: { id: 59144, name: "Linea", color: "green", icon: "/chains/linea.png" },
    tokenAddress: "0xA219439258ca9da29E9Cc4cE5596924745e12B93",
    rpcUrl: getRpcUrl(59144),
  },
  1030: {
    chain: { id: 1030, name: "Conflux eSpace", color: "orange", icon: "/chains/conflux.png" },
    tokenAddress: "0xfe97E85d13ABD9c1c33384E796F10B73905637cE",
    rpcUrl: getRpcUrl(1030),
  },
};

// USDC token addresses
export const USDC_TOKENS: Record<
  number,
  { chain: ChainInfo; tokenAddress: string; rpcUrl: string }
> = {
  1: {
    chain: { id: 1, name: "Ethereum", color: "blue", icon: "/chains/ethereum.png" },
    tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    rpcUrl: getRpcUrl(1),
  },
  56: {
    chain: { id: 56, name: "BNB Chain", color: "yellow", icon: "/chains/bnb.png" },
    tokenAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    rpcUrl: getRpcUrl(56),
  },
  42161: {
    chain: { id: 42161, name: "Arbitrum One", color: "blue", icon: "/chains/arbitrum.png" },
    tokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    rpcUrl: getRpcUrl(42161),
  },
  10: {
    chain: { id: 10, name: "Optimism", color: "red", icon: "/chains/optimism.png" },
    tokenAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    rpcUrl: getRpcUrl(10),
  },
  137: {
    chain: { id: 137, name: "Polygon", color: "purple", icon: "/chains/polygon.png" },
    tokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    rpcUrl: getRpcUrl(137),
  },
  43114: {
    chain: { id: 43114, name: "Avalanche", color: "red", icon: "/chains/avalanche.png" },
    tokenAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    rpcUrl: getRpcUrl(43114),
  },
  59144: {
    chain: { id: 59144, name: "Linea", color: "green", icon: "/chains/linea.png" },
    tokenAddress: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
    rpcUrl: getRpcUrl(59144),
  },
  8453: {
    chain: { id: 8453, name: "Base", color: "blue", icon: "/chains/base.png" },
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    rpcUrl: getRpcUrl(8453),
  },
  80094: {
    chain: { id: 80094, name: "Berachain", color: "yellow", icon: "/chains/berachain.png" },
    tokenAddress: "0x549943e04f40284185054145c6E4e9568C1D3241",
    rpcUrl: getRpcUrl(80094),
  },
  4337: {
    chain: { id: 4337, name: "Sonic", color: "blue", icon: "/chains/sonic.png" },
    tokenAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
    rpcUrl: getRpcUrl(4337),
  },
};
