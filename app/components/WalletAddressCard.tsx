import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface WalletAddressCardProps {
  walletAddress: string;
  totalBalance: string;
  hasLoadedBalance: boolean;
}

export function WalletAddressCard({ walletAddress, totalBalance, hasLoadedBalance }: WalletAddressCardProps) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format address for display (truncate middle)
  const formatAddress = (address: string) => {
    if (!address || address.length <= 14) return address;
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 6
    )}`;
  };

  return (
    <div className="rounded-md bg-gray-900/60 p-3 border border-gray-700/60 space-y-3">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-400">Owner Address</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-gray-400 hover:text-white hover:bg-gray-700/60"
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
        <div className="font-mono text-sm text-gray-300">
          {formatAddress(walletAddress)}
        </div>
      </div>

      <div className="border-t border-gray-700/60 pt-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-400">
            Stablecoin Balance
          </span>
          <span className="text-xs px-2 py-0.5 bg-gray-800 rounded-full text-gray-400">
            USDT + USDC
          </span>
        </div>
        <div className="font-mono text-lg font-semibold text-blue-400">
          <div className="flex items-center">
            ${totalBalance}
            {!hasLoadedBalance && (
              <LoadingSpinner size={4} className="ml-2 text-blue-400/70" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
