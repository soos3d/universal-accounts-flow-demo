import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { 
  USDT_TOKENS, 
  USDC_TOKENS, 
  ERC20_ABI, 
  TOKEN_METADATA, 
  TokenType, 
  AssetItem 
} from '@/app/utils/serverTokenConfig';

// Configuration for optimized balance fetching
const FETCH_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 20,
  BATCH_DELAY: 300,
  RPC_TIMEOUT: 6000,
  CACHE_DURATION_MS: 30000 // 30 seconds
};

// Response data structure
interface BalanceResponse {
  assets: AssetItem[];
  totalUsdValue: string;
  tokenMetadata: typeof TOKEN_METADATA;
  timestamp: string;
  cached: boolean;
  nextRefreshIn?: number;
  cacheAge?: number;
  error?: string;
}

// In-memory cache for balance data
interface BalanceCache {
  [walletAddress: string]: {
    timestamp: number;
    data: Omit<BalanceResponse, 'cached' | 'nextRefreshIn' | 'cacheAge'>;
  };
}

// Global cache object
const balanceCache: BalanceCache = {};

// Function to extract provider domain from RPC URL for rate limit grouping
const getProviderDomain = (rpcUrl: string): string => {
  try {
    const url = new URL(rpcUrl);
    return url.hostname;
  } catch {
    return rpcUrl; // Return full URL if parsing fails
  }
};

// Map of known decimals for tokens on specific chains to reduce RPC calls
const KNOWN_DECIMALS: Record<string, Record<string, number>> = {
  // Chain ID -> Token Type -> Decimals
  "56": { "USDT": 18 }, // BNB Chain USDT uses 18 decimals
  "1": { "USDT": 6, "USDC": 6 }, // Ethereum defaults
  "default": { "USDT": 6, "USDC": 6 } // Default fallback
};

// Function to fetch token balance from a specific chain
const fetchTokenBalance = async (
  walletAddress: string,
  tokenConfig: typeof USDT_TOKENS[number], 
  tokenType: TokenType
): Promise<AssetItem | null> => {
  const chainInfo = tokenConfig.chain;
  const tokenAddress = tokenConfig.tokenAddress;
  const tokenMetadata = TOKEN_METADATA[tokenType];
  const rpcUrl = tokenConfig.rpcUrl;
  
  if (!rpcUrl) return null;

  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Set timeout for RPC calls
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout`)), FETCH_CONFIG.RPC_TIMEOUT);
    });

    // Determine token decimals
    let decimals = 6; // Default fallback
    
    // Use known decimals if available to reduce RPC calls
    if (KNOWN_DECIMALS[chainInfo.id]?.[tokenType]) {
      decimals = KNOWN_DECIMALS[chainInfo.id][tokenType];
    } else if (KNOWN_DECIMALS.default[tokenType]) {
      decimals = KNOWN_DECIMALS.default[tokenType];
    } else {
      try {
        decimals = await Promise.race([tokenContract.decimals(), timeoutPromise]);
      } catch {
        // Keep using default if contract call fails
      }
    }

    // Get balance with timeout
    const balance = await Promise.race([tokenContract.balanceOf(walletAddress), timeoutPromise]);
    const formattedBalance = ethers.formatUnits(balance, decimals);
    const balanceFloat = parseFloat(formattedBalance);

    // Skip if balance is 0
    if (balanceFloat <= 0) return null;

    // For stablecoins, assume 1:1 USD value
    return {
      chain: chainInfo,
      symbol: tokenMetadata.symbol,
      tokenType,
      balance: formattedBalance,
      balanceUSD: balanceFloat.toFixed(2),
      tokenAddress,
      tokenImage: tokenMetadata.image,
    };
  } catch {
    return null;
  }
};

// Priority chains to check first (most likely to have balances)
const PRIORITY_CHAINS = [
  // Tier 1: Major chains people are most likely to use
  56,    // BNB Chain
  1,     // Ethereum
  8453,  // Base
  137,   // Polygon
  42161, // Arbitrum
  
  // Tier 2: Secondary chains
  10,    // Optimism
  43114, // Avalanche
  80094, // Berachain
  
  // Tier 3: Less common chains
  59144, // Linea
  4337,  // Sonic
  1030   // Conflux
];

// Function to create prioritized token configurations
const getPrioritizedTokenConfigs = () => {
  const configs: {config: typeof USDT_TOKENS[number], tokenType: TokenType}[] = [];
  
  // Helper to add tokens with priority order
  const addTokens = (tokens: typeof USDT_TOKENS, tokenType: TokenType) => {
    // First add priority chains
    for (const chainId of PRIORITY_CHAINS) {
      if (tokens[chainId]) {
        configs.push({config: tokens[chainId], tokenType});
      }
    }
    
    // Then add remaining chains
    Object.entries(tokens).forEach(([id, config]) => {
      if (!PRIORITY_CHAINS.includes(Number(id))) {
        configs.push({config, tokenType});
      }
    });
  };
  
  // Add USDT and USDC configs in priority order
  addTokens(USDT_TOKENS, 'USDT');
  addTokens(USDC_TOKENS, 'USDC');
  
  return configs;
};

/**
 * Fetch token balances for a wallet across multiple chains
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('address');
  const forceRefresh = searchParams.get('force') === 'true';

  // Validate wallet address
  if (!walletAddress) {
    return NextResponse.json({ 
      success: false, 
      error: 'Wallet address is required' 
    }, { status: 400 });
  }
  
  // Validate address format
  let formattedAddress: string;
  try {
    formattedAddress = ethers.getAddress(walletAddress);
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid Ethereum address format' 
    }, { status: 400 });
  }
  
  // Check cache for recent results
  const cachedResult = balanceCache[formattedAddress];
  const currentTime = Date.now();
  
  if (
    !forceRefresh && 
    cachedResult && 
    currentTime - cachedResult.timestamp < FETCH_CONFIG.CACHE_DURATION_MS
  ) {
    const cacheAge = currentTime - cachedResult.timestamp;
    return NextResponse.json({
      success: true,
      ...cachedResult.data,
      cached: true,
      cacheAge: Math.round(cacheAge / 1000),
      nextRefreshIn: Math.round((FETCH_CONFIG.CACHE_DURATION_MS - cacheAge) / 1000)
    });
  }

  try {
    // Get prioritized token configurations
    const tokenConfigs = getPrioritizedTokenConfigs();
    
    // Group requests by provider domain to avoid rate limits
    const providerGroups: Record<string, {config: typeof USDT_TOKENS[number], tokenType: TokenType}[]> = {};
    
    tokenConfigs.forEach(({config, tokenType}) => {
      if (!config.rpcUrl) return;
      
      const providerDomain = getProviderDomain(config.rpcUrl);
      if (!providerGroups[providerDomain]) {
        providerGroups[providerDomain] = [];
      }
      providerGroups[providerDomain].push({config, tokenType});
    });
    
    const assets: AssetItem[] = [];
    let totalUsdValue = 0;
    
    // Process each provider group with batch delays
    for (const configs of Object.values(providerGroups)) {
      // Process in batches
      for (let i = 0; i < configs.length; i += FETCH_CONFIG.MAX_CONCURRENT_REQUESTS) {
        const batch = configs.slice(i, i + FETCH_CONFIG.MAX_CONCURRENT_REQUESTS);
        
        // Process current batch concurrently
        const results = await Promise.all(
          batch.map(({ config, tokenType }) => 
            fetchTokenBalance(formattedAddress, config, tokenType)
          )
        );
        
        // Add valid results to assets array
        for (const result of results) {
          if (result) {
            assets.push(result);
            const balanceUsdValue = parseFloat(result.balanceUSD);
            if (!isNaN(balanceUsdValue)) {
              totalUsdValue += balanceUsdValue;
            }
          }
        }
        
        // Add delay between batches if needed
        if (i + FETCH_CONFIG.MAX_CONCURRENT_REQUESTS < configs.length) {
          await new Promise(resolve => setTimeout(resolve, FETCH_CONFIG.BATCH_DELAY));
        }
      }
    }

    // Sort assets by USD value (highest first)
    assets.sort((a, b) => parseFloat(b.balanceUSD) - parseFloat(a.balanceUSD));
    
    // Create the response data
    const responseData = {
      assets,
      totalUsdValue: totalUsdValue.toFixed(2),
      tokenMetadata: TOKEN_METADATA,
      timestamp: new Date().toISOString()
    };
    
    // Update the cache
    balanceCache[formattedAddress] = {
      timestamp: currentTime,
      data: responseData
    };
    
    // Return data to the client
    return NextResponse.json({
      success: true,
      ...responseData,
      cached: false,
      nextRefreshIn: Math.round(FETCH_CONFIG.CACHE_DURATION_MS / 1000)
    });
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch token balances' 
    }, { status: 500 });
  }
}
