import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  USDC_TOKENS,
  USDT_TOKENS,
  TOKEN_METADATA,
  ERC20_ABI,
  TokenType,
  AssetItem,
} from "../utils/tokenConfig";

interface TokenTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  universalAccount?: { evmSmartAccount: string };
  availableAssets: AssetItem[];
}

export function TokenTransferDialog({
  open,
  onOpenChange,
  walletAddress,
  universalAccount,
  availableAssets,
}: TokenTransferDialogProps) {
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<TokenType>("USDC");
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [transferStatus, setTransferStatus] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  // Fetch token balance function - using server API
  const fetchTokenBalance = useCallback(
    async (chainId: string) => {
      if (!walletAddress || !chainId) {
        setIsBalanceLoading(false);
        return;
      }

      console.log(`Fetching balance for ${selectedToken} on chain ${chainId}`);
      console.log(
        "Available assets in props:",
        availableAssets.map(
          (a) =>
            `${a.tokenType} on ${a.chain.name} (${a.chain.id}): ${a.balance}`
        )
      );

      setIsBalanceLoading(true);
      try {
        // First, check if we have the token config information
        const chainIdNum = parseInt(chainId);
        const tokenConfig =
          selectedToken === "USDC"
            ? USDC_TOKENS[chainIdNum]
            : USDT_TOKENS[chainIdNum];

        if (!tokenConfig) {
          console.error(`Token config not found for chain ID ${chainId}`);
          setTokenBalance("0");
          setIsBalanceLoading(false);
          return;
        }

        // Check if the balance is already available in availableAssets
        console.log(`Looking for ${selectedToken} on chain ID ${chainIdNum}`);
        const existingAsset = availableAssets.find((asset) => {
          const match =
            asset.chain.id === chainIdNum && asset.tokenType === selectedToken;
          if (match) {
            console.log(
              `Found matching asset: ${asset.tokenType} on ${asset.chain.name} (${asset.chain.id}): ${asset.balance}`
            );
          }
          return match;
        });

        if (existingAsset && existingAsset.balance) {
          console.log(
            `Using existing balance for ${selectedToken} on chain ${chainId}: ${existingAsset.balance}`
          );
          setTokenBalance(existingAsset.balance);
          setIsBalanceLoading(false);
          return;
        }

        // If not available in props, fetch from the API
        console.log(
          `No matching asset found in props, fetching from API for address ${walletAddress}`
        );
        const response = await fetch(
          `/api/get-token-balances?address=${walletAddress}`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Token balances API response:", data);

        if (!data.assets || !Array.isArray(data.assets)) {
          console.error(
            "Invalid API response format - assets missing or not an array",
            data
          );
          setTokenBalance("0");
          return;
        }

        // Find the specific token for this chain and token type
        const assetForChain = data.assets.find((asset: AssetItem) => {
          const match =
            asset.chain.id === chainIdNum && asset.tokenType === selectedToken;
          console.log(
            `Checking asset ${asset.tokenType} on chain ${asset.chain.name} (${asset.chain.id}) - match: ${match}`
          );
          return match;
        });

        if (assetForChain && assetForChain.balance) {
          console.log(
            `Setting balance for ${selectedToken} on chain ${chainId}: ${assetForChain.balance}`
          );
          setTokenBalance(assetForChain.balance);
        } else {
          // If no balance found for this token on this chain, set to 0
          console.log(
            `No balance found for ${selectedToken} on chain ${chainId}`
          );
          setTokenBalance("0");
        }
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setTokenBalance("0");
      } finally {
        setIsBalanceLoading(false);
      }
    },
    [walletAddress, selectedToken, availableAssets]
  );

  // Update selected chain when token type changes or available assets update
  useEffect(() => {
    if (!selectedToken) {
      console.log("No token selected yet");
      return;
    }

    console.log(`Checking for assets matching token: ${selectedToken}`);
    console.log(
      "Available assets:",
      availableAssets?.map(
        (a) => `${a.tokenType} on ${a.chain.name} (${a.chain.id}): ${a.balance}`
      ) || "none"
    );

    if (availableAssets && availableAssets.length > 0) {
      // Check if current selected chain has assets of the selected token type
      if (selectedChain) {
        const hasMatchingAsset = availableAssets.some(
          (asset) =>
            asset.tokenType === selectedToken &&
            asset.chain.id.toString() === selectedChain
        );

        if (hasMatchingAsset) {
          console.log(
            `Current chain ${selectedChain} has matching assets, keeping it selected`
          );
          return; // Keep current selection if valid
        }
      }

      // Find assets matching the selected token type
      const matchingAssets = availableAssets.filter(
        (asset) => asset.tokenType === selectedToken
      );
      console.log(
        `Found ${matchingAssets.length} matching assets for ${selectedToken}`
      );

      if (matchingAssets.length > 0) {
        // Sort by balance desc to select the chain with highest balance first
        const sortedAssets = [...matchingAssets].sort((a, b) => {
          const balanceA = parseFloat(a.balance || "0");
          const balanceB = parseFloat(b.balance || "0");
          return balanceB - balanceA;
        });

        const firstMatchingAsset = sortedAssets[0];
        console.log(
          `Selected chain ${firstMatchingAsset.chain.name} (${firstMatchingAsset.chain.id}) with balance ${firstMatchingAsset.balance}`
        );
        setSelectedChain(firstMatchingAsset.chain.id.toString());
      } else {
        console.log(
          `No matching assets found for ${selectedToken}, clearing chain`
        );
        setSelectedChain("");
      }
    } else {
      console.log(`No available assets, falling back to token config`);
      // Fallback to first available chain in token config when no assets available
      const availableChains = Object.values(
        selectedToken === "USDC" ? USDC_TOKENS : USDT_TOKENS
      );
      if (availableChains.length > 0) {
        const chainId = availableChains[0].chain.id.toString();
        console.log(`Falling back to first config chain: ${chainId}`);
        setSelectedChain(chainId);
      }
    }
  }, [selectedToken, availableAssets, selectedChain]);

  // Fetch token balance when transfer modal opens or when the selected chain changes
  useEffect(() => {
    if (open && selectedChain) {
      console.log(`Modal open, fetching balance for chain ${selectedChain}`);
      // Small delay to ensure UI is rendered first
      setTimeout(() => fetchTokenBalance(selectedChain), 100);
    }
  }, [open, selectedChain, walletAddress, fetchTokenBalance]);

  // Fetch token balances when assets change or dialog opens
  useEffect(() => {
    if (open && selectedChain) {
      console.log(
        "Dialog open or assets updated, refreshing displayed balance"
      );
      console.log(
        `Current selection: ${selectedToken} on chain ${selectedChain}`
      );
      fetchTokenBalance(selectedChain);
    }
  }, [open, availableAssets, selectedChain, fetchTokenBalance, selectedToken]);

  // Handle token transfer with approval
  const handleTransfer = async () => {
    if (
      !walletAddress ||
      !selectedChain ||
      !transferAmount ||
      !universalAccount?.evmSmartAccount
    ) {
      return;
    }

    setTransferStatus({
      status: "loading",
      message: "Preparing transaction...",
    });

    try {
      const chainId = parseInt(selectedChain);
      const tokenConfig =
        selectedToken === "USDC" ? USDC_TOKENS[chainId] : USDT_TOKENS[chainId];

      if (!tokenConfig) {
        throw new Error(`Token config not found for chain ID ${chainId}`);
      }

      // Connect to provider with signer
      console.log(`Connecting to network for chain ID: ${chainId}`);
      console.log(`Token address from config: ${tokenConfig.tokenAddress}`);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      try {
        // Get network info for debugging
        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
        
        // Verify chain ID matches
        if (network.chainId !== BigInt(chainId)) {
          console.log(`⚠️ Network mismatch. Expected ${chainId}, got ${network.chainId}`);
          setTransferStatus({
            status: "loading",
            message: `Please switch to the ${tokenConfig.chain.name} network in your wallet`
          });
          
          // Attempt to switch networks if on MetaMask
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${chainId.toString(16)}` }],
            });
            console.log(`Successfully switched to chain ID: ${chainId}`);
          } catch (switchError) {
            console.error("Failed to switch network:", switchError);
            throw new Error(`Please manually switch to the ${tokenConfig.chain.name} network`);  
          }
        }
      } catch (networkError) {
        console.error("Error checking network:", networkError);
        // Continue anyway and hope for the best
      }
      
      // Get signer
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log(`Using signer with address: ${signerAddress}`);
      
      // Create contract instance with signer for sending transactions
      console.log(`Creating contract with address: ${tokenConfig.tokenAddress}`);
      console.log(`ABI contains these methods:`, ERC20_ABI);
      
      const tokenContract = new ethers.Contract(
        tokenConfig.tokenAddress,
        ERC20_ABI,
        signer
      );
      
      // Use a fixed decimals value - don't rely on contract call if it's failing
      console.log(`Using fixed decimal value for ${selectedToken}`);
      const decimals = selectedToken === "USDC" || selectedToken === "USDT" ? 6 : 18;

      // Convert amount to token units with proper decimals
      const transferAmountBN = ethers.parseUnits(transferAmount, decimals);

      // Use direct transfer instead of approve/transferFrom pattern
      // This simplifies the process and reduces chances of errors
      setTransferStatus({ status: "loading", message: "Preparing transfer..." });
      
      console.log(`Transferring ${transferAmount} ${selectedToken} to Universal Account`);
      console.log(`Target address: ${universalAccount.evmSmartAccount}`);
      console.log(`Amount in wei: ${transferAmountBN.toString()}`);
      
      try {
        // Simple direct transfer
        setTransferStatus({ status: "loading", message: "Sending tokens..." });
        const tx = await tokenContract.transfer(
          universalAccount.evmSmartAccount,
          transferAmountBN
        );
        
        console.log('Transaction submitted:', tx.hash);
        
        // Wait for transaction to be mined
        setTransferStatus({ status: "loading", message: "Confirming transfer..." });
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        
        // Log success and continue to the success handler
        console.log("Transfer successful:", receipt);
        
        // Set success status
        setTransferStatus({
          status: "success", 
          message: `Successfully transferred ${transferAmount} ${selectedToken} to your Universal Account`,
        });

        // Reset form after successful transfer
        setTimeout(() => {
          setTransferAmount("");
          fetchTokenBalance(selectedChain);
        }, 2000);
        
        return;
      } catch (transferError: unknown) {
        console.error("Transfer failed:", transferError);
        
        // If the direct transfer failed, log detailed info for debugging
        console.log("Detailed error info:", {
          tokenAddress: tokenConfig.tokenAddress,
          chainId,
          decimals,
          amount: transferAmount,
          amountInWei: transferAmountBN.toString()
        });
        
        // Rethrow with more useful message and proper type handling
        const errorMessage = transferError instanceof Error 
          ? transferError.message 
          : 'Unknown transfer error';
          
        setTransferStatus({
          status: "error",
          message: `Failed to transfer tokens: ${errorMessage}`,
        });
        return;
      }

      setTransferStatus({
        status: "success",
        message: `Successfully transferred ${transferAmount} ${selectedToken} to your Universal Account`,
      });

      // Reset form after successful transfer
      setTimeout(() => {
        setTransferAmount("");
        fetchTokenBalance(selectedChain);
      }, 2000);
    } catch (error) {
      console.error("Transfer error:", error);
      setTransferStatus({
        status: "error",
        message: `Failed to transfer tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Transfer to Universal Account
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Send USDC or USDT from your wallet to your Universal Account
          </DialogDescription>
        </DialogHeader>

        {transferStatus.status === "error" && (
          <Alert
            variant="destructive"
            className="bg-red-900/30 border-red-800 text-red-300"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{transferStatus.message}</AlertDescription>
          </Alert>
        )}

        {transferStatus.status === "success" && (
          <Alert className="bg-green-900/30 border-green-800 text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{transferStatus.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token" className="text-gray-300">
              Token
            </Label>
            <Select
              value={selectedToken}
              onValueChange={(value: TokenType) => {
                console.log(`Token changed to ${value}`);
                setSelectedToken(value);
                setTokenBalance("0");
                setIsBalanceLoading(true);

                // Find available chains for this token type, sorted by balance
                const matchingAssets = availableAssets
                  .filter((asset) => asset.tokenType === value)
                  .sort((a, b) => {
                    const balanceA = parseFloat(a.balance || "0");
                    const balanceB = parseFloat(b.balance || "0");
                    return balanceB - balanceA;
                  });

                console.log(
                  `Found ${matchingAssets.length} matching assets for ${value}`
                );

                if (matchingAssets.length > 0) {
                  const chainId = matchingAssets[0].chain.id.toString();
                  console.log(
                    `Setting chain to ${chainId} with balance ${matchingAssets[0].balance}`
                  );
                  setSelectedChain(chainId);
                  // Fetch balance for this chain with small delay
                  setTimeout(() => fetchTokenBalance(chainId), 100);
                } else {
                  // Fallback to first chain in token config
                  const availableChains = Object.values(
                    value === "USDC" ? USDC_TOKENS : USDT_TOKENS
                  );
                  if (availableChains.length > 0) {
                    const chainId = availableChains[0].chain.id.toString();
                    console.log(
                      `No assets found, falling back to first config chain: ${chainId}`
                    );
                    setSelectedChain(chainId);
                    setTimeout(() => fetchTokenBalance(chainId), 100);
                  } else {
                    setSelectedChain("");
                    setIsBalanceLoading(false);
                  }
                }
              }}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectGroup>
                  <SelectLabel>Stablecoins</SelectLabel>
                  <SelectItem value="USDC" className="flex items-center">
                    <div className="flex items-center">
                      <span className="mr-2 inline-block w-5 h-5 relative">
                        <Image
                          src={TOKEN_METADATA.USDC.image}
                          alt="USDC"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </span>
                      USDC
                    </div>
                  </SelectItem>
                  <SelectItem value="USDT">
                    <div className="flex items-center">
                      <span className="mr-2 inline-block w-5 h-5 relative">
                        <Image
                          src={TOKEN_METADATA.USDT.image}
                          alt="USDT"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </span>
                      USDT
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chain" className="text-gray-300">
              Network
            </Label>
            <Select
              value={selectedChain}
              onValueChange={(value) => {
                console.log(`Network changed to ${value}`);
                const chainIdNum = parseInt(value);
                setSelectedChain(value);

                // First check if we already have this balance in availableAssets
                const existingAsset = availableAssets?.find(
                  (asset) =>
                    asset.chain.id === chainIdNum &&
                    asset.tokenType === selectedToken
                );

                if (existingAsset && existingAsset.balance) {
                  console.log(
                    `Using existing balance for network change: ${existingAsset.balance}`
                  );
                  setTokenBalance(existingAsset.balance);
                } else {
                  // Reset balance and show loading immediately
                  setTokenBalance("0");
                  setIsBalanceLoading(true);
                  // Fetch the balance immediately
                  fetchTokenBalance(value);
                }
              }}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-gray-800 border-gray-700 text-gray-300">
                <SelectGroup>
                  <SelectLabel className="text-gray-400">
                    Select Network
                  </SelectLabel>
                  {availableAssets && availableAssets.length > 0
                    ? // Filter to only show chains where user has tokens of the selected type
                      availableAssets
                        .filter((asset) => asset.tokenType === selectedToken)
                        // Get unique chains only
                        .filter(
                          (asset, index, self) =>
                            index ===
                            self.findIndex((a) => a.chain.id === asset.chain.id)
                        )
                        // Sort by balance (highest first)
                        .sort((a, b) => {
                          const balanceA = parseFloat(a.balance || "0");
                          const balanceB = parseFloat(b.balance || "0");
                          return balanceB - balanceA;
                        })
                        .map((asset) => (
                          <SelectItem
                            key={asset.chain.id}
                            value={asset.chain.id.toString()}
                            // Use chain.id as the value but display only the chain name
                            // Store balance information in a data attribute for reference
                            data-balance={asset.balance}
                          >
                            <div className="flex items-center">
                              {asset.chain.icon && (
                                <span className="mr-2 inline-block w-5 h-5 relative">
                                  <Image
                                    src={asset.chain.icon}
                                    alt={asset.chain.name}
                                    width={20}
                                    height={20}
                                    className="object-contain"
                                  />
                                </span>
                              )}
                              {asset.chain.name}
                            </div>
                          </SelectItem>
                        ))
                    : // Fallback to show all chains if no assets data is available yet
                      Object.values(
                        selectedToken === "USDC" ? USDC_TOKENS : USDT_TOKENS
                      ).map((token) => (
                        <SelectItem
                          key={token.chain.id}
                          value={token.chain.id.toString()}
                        >
                          <div className="flex items-center">
                            {token.chain.icon && (
                              <span className="mr-2 inline-block w-5 h-5 relative">
                                <Image
                                  src={token.chain.icon}
                                  alt={token.chain.name}
                                  width={20}
                                  height={20}
                                  className="object-contain"
                                />
                              </span>
                            )}
                            {token.chain.name}
                          </div>
                        </SelectItem>
                      ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount" className="text-gray-300">
                Amount
              </Label>
              <div className="text-xs text-gray-400 flex items-center justify-end">
                Balance:{" "}
                {isBalanceLoading ? (
                  <LoadingSpinner size={3} className="ml-1" />
                ) : (
                  <span>
                    {parseFloat(tokenBalance) > 0
                      ? Number(parseFloat(tokenBalance).toFixed(6)).toString()
                      : "0"}
                    {parseFloat(tokenBalance) > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-blue-400 px-1 h-5"
                        onClick={() => setTransferAmount(tokenBalance)}
                      >
                        Max
                      </Button>
                    )}
                  </span>
                )}
              </div>
            </div>
            <Input
              id="amount"
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.00"
              className="bg-gray-800 border-gray-700 text-gray-300"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              !selectedChain ||
              !transferAmount ||
              parseFloat(transferAmount) <= 0 ||
              transferStatus.status === "loading" ||
              parseFloat(transferAmount) > parseFloat(tokenBalance)
            }
            onClick={handleTransfer}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {transferStatus.status === "loading" ? (
              <>
                <LoadingSpinner className="-ml-1 mr-2" />
                Processing...
              </>
            ) : (
              "Transfer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
