import { IAssetsResponse } from "@GDdark/universal-account";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AccountInfoProps {
  accountInfo: {
    ownerAddress: string;
    evmSmartAccount: string;
    solanaSmartAccount: string;
  };
  primaryAssets: IAssetsResponse | null;
}

/**
 * AccountInfo Component
 * Displays the Universal Account information including:
 * - Total balance in USD
 * - EVM Smart Account address
 */
export function AccountInfo({ accountInfo, primaryAssets }: AccountInfoProps) {
  const [copiedEVM, setCopiedEVM] = useState(false);

  const copyToClipboard = (
    text: string,
    setStateFn: (value: boolean) => void
  ) => {
    navigator.clipboard.writeText(text);
    setStateFn(true);
    setTimeout(() => setStateFn(false), 2000);
  };

  // Format addresses for display (truncate middle)
  const formatAddress = (address: string) => {
    if (address.length <= 14) return address;
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 6
    )}`;
  };

  return (
    <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-400" />
              <span>Account Info</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your Universal Account details
            </CardDescription>
          </div>
          {primaryAssets && (
            <div className="text-right">
              <div className="text-xs text-gray-400">Balance</div>
              <div className="font-mono text-xl font-bold text-blue-400">
                ${Number(primaryAssets?.totalAmountInUSD || 0).toFixed(3)}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          {/* EVM Smart Account */}
          <div className="rounded-md bg-gray-900/60 p-3 border border-gray-700/60">
            <div className="flex justify-between items-center mb-1">
              <Badge
                variant="outline"
                className="bg-indigo-900/30 text-indigo-300 border-indigo-800/60 px-2 py-0 text-xs"
              >
                EVM
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-gray-400 hover:text-white hover:bg-gray-700/60"
                onClick={() =>
                  copyToClipboard(accountInfo.evmSmartAccount, setCopiedEVM)
                }
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedEVM ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="font-mono text-xs text-gray-300 break-all">
              {formatAddress(accountInfo.evmSmartAccount)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
