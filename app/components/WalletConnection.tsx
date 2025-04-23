import { useEffect, useCallback, useState } from "react";
import { ethers } from "ethers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Send } from "lucide-react";
import { PortfolioModal } from "./PortfolioModal";
import { TokenTransferDialog } from "./TokenTransferDialog";
import { WalletAddressCard } from "./WalletAddressCard";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { AssetItem } from "../utils/tokenConfig";

interface WalletConnectionProps {
  walletAddress: string;
  isConnecting: boolean;
  onWalletUpdate: (address: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  universalAccount?: {
    evmSmartAccount: string;
  };
}

/**
 * WalletConnection Component
 * Handles the wallet connection logic and UI for connecting/disconnecting MetaMask
 */
export function WalletConnection({
  walletAddress,
  isConnecting,
  onWalletUpdate,
  onConnect,
  onDisconnect,
  universalAccount,
}: WalletConnectionProps) {
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [totalBalance, setTotalBalance] = useState("0.00");
  const [hasLoadedBalance, setHasLoadedBalance] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<AssetItem[]>([]);

  // Fetch token balances for the connected wallet
  const fetchTokenBalances = useCallback(async () => {
    if (!walletAddress) return;
    
    setHasLoadedBalance(false);
    try {
      const response = await fetch(`/api/get-token-balances?address=${walletAddress}`);
      if (!response.ok) throw new Error('Failed to fetch balances');
      
      const data = await response.json();
      const assets = data.assets || [];
      setAvailableAssets(assets);
      
      // Calculate total stablecoin balance (USDT + USDC)
      const stablecoins = assets.filter((asset: AssetItem) => 
        asset.symbol === 'USDT' || asset.symbol === 'USDC'
      );
      
      const total = stablecoins.reduce((sum: number, token: AssetItem) => {
        return sum + parseFloat(token.balance || '0');
      }, 0);
      
      setTotalBalance(total.toFixed(2));
      setHasLoadedBalance(true);
    } catch (error) {
      console.error('Error fetching balances:', error);
      setHasLoadedBalance(true);
    }
  }, [walletAddress]);

  const updateWalletAddress = useCallback(async () => {
    if (typeof window.ethereum === "undefined") return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      onWalletUpdate(accounts.length > 0 ? accounts[0].address : "");
    } catch (error) {
      console.error("Error updating wallet address:", error);
      onWalletUpdate("");
    }
  }, [onWalletUpdate]);

  useEffect(() => {
    // Check if already connected
    updateWalletAddress();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", updateWalletAddress);
    }

    // Cleanup listeners on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", updateWalletAddress);
      }
    };
  }, [updateWalletAddress]);

  // Fetch token balances when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchTokenBalances();
    } else {
      setTotalBalance("0.00");
      setHasLoadedBalance(true);
      setAvailableAssets([]);
    }
  }, [walletAddress, fetchTokenBalances]);

  return (
    <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-400" />
          <span>Wallet</span>
        </CardTitle>
        <CardDescription className="text-gray-400">
          {walletAddress
            ? "This is your EOA wallet"
            : "Connect your wallet to continue"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!walletAddress ? (
          <Button
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isConnecting ? (
              <>
                <LoadingSpinner className="-ml-1 mr-2 h-4 w-4" />
                Connecting...
              </>
            ) : (
              <>Connect Wallet</>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/60 hover:text-white hover:border-gray-600"
                onClick={() => setPortfolioOpen(true)}
                disabled={!walletAddress}
              >
                Portfolio
              </Button>

              <Button
                onClick={onDisconnect}
                variant="outline"
                size="sm"
                className="flex-1 bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/60 hover:text-white hover:border-gray-600"
              >
                Disconnect
              </Button>
            </div>

            <WalletAddressCard
              walletAddress={walletAddress}
              totalBalance={totalBalance}
              hasLoadedBalance={hasLoadedBalance}
            />

            {universalAccount?.evmSmartAccount && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/60 hover:text-white hover:border-gray-600"
                onClick={() => setTransferOpen(true)}
                disabled={!walletAddress}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Transfer to Universal Account
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Portfolio Modal */}
      <PortfolioModal
        open={portfolioOpen}
        onOpenChange={setPortfolioOpen}
        walletAddress={walletAddress}
      />

      {/* Token Transfer Dialog */}
      <TokenTransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        walletAddress={walletAddress}
        universalAccount={universalAccount}
        availableAssets={availableAssets}
      />
    </Card>
  );
}
