import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, BarChart3 } from "lucide-react";
import Image from "next/image";
import { TokenType, AssetItem, TokenMetadata } from "../utils/tokenConfig";

interface ChainInfo {
  id: number;
  name: string;
  color: string;
  icon?: string;
}

interface PortfolioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
}

export function PortfolioModal({
  open,
  onOpenChange,
  walletAddress,
}: PortfolioModalProps) {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState("0.00");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const isFetching = useRef(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchAssetsWithinEffect = useCallback(async () => {
    if (!walletAddress || !isMounted.current || isFetching.current) return;

    isFetching.current = true;
    setError(null);

    try {
      console.log(`Fetching balances for wallet: ${walletAddress}`);

      const response = await fetch(
        `/api/get-token-balances?address=${walletAddress}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      if (!isMounted.current) return;

      const data = await response.json();
      setDebugInfo(JSON.stringify(data, null, 2));

      const { assets: combinedAssets, totalUsdValue } = data;

      setAssets(combinedAssets);
      setTotalBalanceUSD(totalUsdValue);
    } catch (error) {
      console.error("Error fetching portfolio assets:", error);
      if (isMounted.current) {
        setError("Failed to fetch portfolio assets. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      isFetching.current = false;
    }
  }, [walletAddress]);

  // 🔧 NEW: Initial fetch when walletAddress & modal open
  useEffect(() => {
    if (walletAddress) {
      console.log("Initial fetch triggered by walletAddress & modal open");
      fetchAssetsWithinEffect();
    }
  }, [walletAddress, fetchAssetsWithinEffect]);

  // Setup polling every 30s
  useEffect(() => {
    if (!walletAddress) return;

    // ✅ Only set the interval if it hasn't been set yet
    if (!intervalIdRef.current) {
      intervalIdRef.current = setInterval(() => {
        if (walletAddress && isMounted.current) {
          console.log("Polling token balances (30s interval)");
        }
      }, 1000);
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
        console.log("Cleared balance polling interval");
      }
    };
  }, [walletAddress]);

  const fetchAssets = () => {
    fetchAssetsWithinEffect();
  };

  const getChainIcon = (chain: ChainInfo) => {
    if (!chain.icon) return null;
    return (
      <div className="relative w-4 h-4">
        <Image
          src={chain.icon}
          alt={chain.name}
          fill
          className="object-contain"
        />
      </div>
    );
  };

  const getChainBadgeClass = (chainColor: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-900/30 text-blue-300 border-blue-800/60",
      red: "bg-red-900/30 text-red-300 border-red-800/60",
      green: "bg-green-900/30 text-green-300 border-green-800/60",
      yellow: "bg-yellow-900/30 text-yellow-300 border-yellow-800/60",
      purple: "bg-purple-900/30 text-purple-300 border-purple-800/60",
      pink: "bg-pink-900/30 text-pink-300 border-pink-800/60",
      orange: "bg-orange-900/30 text-orange-300 border-orange-800/60",
      indigo: "bg-indigo-900/30 text-indigo-300 border-indigo-800/60",
      cyan: "bg-cyan-900/30 text-cyan-300 border-cyan-800/60",
      violet: "bg-violet-900/30 text-violet-300 border-violet-800/60",
      emerald: "bg-emerald-900/30 text-emerald-300 border-emerald-800/60",
    };
    return (
      colorMap[chainColor] || "bg-gray-900/30 text-gray-300 border-gray-800/60"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5 text-green-400" />
            Stablecoin Balances
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Your USDT and USDC token balances
            {process.env.NODE_ENV === "development" && (
              <span
                className="text-xs ml-2 text-gray-500 cursor-pointer"
                onClick={() => alert(debugInfo || "No response data available")}
              >
                [Debug]
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex flex-row items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-medium text-gray-200">
                  Token Portfolio
                </h3>
              </div>
              <button
                onClick={fetchAssets}
                disabled={isFetching.current}
                className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-md transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="text-lg text-gray-200">Assets Overview</div>
              <button
                onClick={fetchAssets}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                title="Refresh balances"
                disabled={isLoading}
              >
                <svg
                  className={`w-5 h-5 ${
                    isFetching.current || isLoading ? "animate-spin" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            {error ? (
              <div className="text-center py-8 text-red-400 animate-in fade-in duration-500">
                <div className="rounded-full bg-red-900/20 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 opacity-75"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-1">{error}</p>
                <button
                  onClick={fetchAssets}
                  className="mt-4 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 rounded-lg transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            ) : isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg border border-gray-700/30 bg-gray-800/30"
                  >
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-6 w-24 bg-gray-700/50" />
                      <Skeleton className="h-4 w-16 bg-gray-700/50" />
                    </div>
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-24 bg-gray-700/50" />
                      <Skeleton className="h-4 w-20 bg-gray-700/50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : assets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Network</TableHead>
                    <TableHead className="text-gray-400">Asset</TableHead>
                    <TableHead className="text-gray-400 text-right">
                      Balance
                    </TableHead>
                    <TableHead className="text-gray-400 text-right">
                      Value (USD)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset, index) => (
                    <TableRow key={index} className="border-gray-700">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getChainBadgeClass(
                            asset.chain.color
                          )} px-2 py-0.5 text-xs flex items-center gap-1.5`}
                        >
                          {getChainIcon(asset.chain)}
                          {asset.chain.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="relative w-5 h-5">
                            <Image
                              src={asset.tokenImage}
                              alt={asset.symbol}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className="font-medium text-gray-200">
                            {asset.symbol}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-300">
                        {asset.balance}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-${
                          asset.tokenType === "USDT" ? "green-400" : "blue-400"
                        }`}
                      >
                        ${asset.balanceUSD}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-400 animate-in fade-in duration-500">
                <div className="rounded-full bg-gray-800/50 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Wallet className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-lg font-medium mb-1">No Stablecoins Found</p>
                <p className="text-sm text-gray-500">
                  Your wallet doesn&apos;t have any USDT or USDC tokens on the
                  supported chains
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
