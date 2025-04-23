"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  Coins,
  Wallet,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { IAssetsResponse } from "@GDdark/universal-account";

interface DepositSectionProps {
  isProcessing: boolean;
  transactionError: string;
  transactionUrl: string;
  accountInfo: {
    ownerAddress: string;
    evmSmartAccount: string;
    solanaSmartAccount: string;
  };
  primaryAssets: IAssetsResponse | null;
  onDeposit: (amount: string, destinationChain: string) => Promise<void>;
}

// Fixed destination chain - Arbitrum
const DESTINATION_CHAIN = {
  value: "arbitrum",
  label: "Arbitrum",
  icon: "A",
  color: "blue",
};

export function DepositSection({
  isProcessing,
  transactionError,
  transactionUrl,
  accountInfo,
  primaryAssets,
  onDeposit,
}: DepositSectionProps) {
  const [amount, setAmount] = useState<string>("");
  const [copiedEVM, setCopiedEVM] = useState(false);

  // Fixed destination chain to Arbitrum
  const destinationChain = DESTINATION_CHAIN.value;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount) {
      onDeposit(amount, destinationChain);
    }
  };

  // Format addresses for display (truncate middle)
  const formatAddress = (address: string) => {
    if (address.length <= 14) return address;
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 6
    )}`;
  };

  // Copy to clipboard functionality
  const copyToClipboard = (
    text: string,
    setStateFn: (value: boolean) => void
  ) => {
    navigator.clipboard.writeText(text);
    setStateFn(true);
    setTimeout(() => setStateFn(false), 2000);
  };

  // Helper to get color classes
  const getTokenColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      indigo: "bg-indigo-900/30 text-indigo-300 border-indigo-800/60",
      blue: "bg-blue-900/30 text-blue-300 border-blue-800/60",
      green: "bg-green-900/30 text-green-300 border-green-800/60",
      yellow: "bg-yellow-900/30 text-yellow-300 border-yellow-800/60",
      purple: "bg-purple-900/30 text-purple-300 border-purple-800/60",
      red: "bg-red-900/30 text-red-300 border-red-800/60",
    };
    return colorMap[color] || "bg-gray-900/30 text-gray-300 border-gray-800/60";
  };

  return (
    <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-400" />
              Universal Account
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Deposit assets to Arbitrum via your Universal Account
            </CardDescription>
          </div>
          {primaryAssets && (
            <div className="text-right">
              <div className="text-xs text-gray-400">Universal Balance</div>
              <div className="font-mono text-xl font-bold text-blue-400">
                ${Number(primaryAssets?.totalAmountInUSD || 0).toFixed(3)}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Account Info Section */}
        <div className="mb-6">
          <div className="rounded-md bg-gray-900/60 p-3 border border-gray-700/60">
            <div className="flex justify-between items-center mb-1">
              <Badge
                variant="outline"
                className="bg-indigo-900/30 text-indigo-300 border-indigo-800/60 px-2 py-0 text-xs"
              >
                EVM Universal Account
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-300 font-medium">
              Amount
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                placeholder="0.00"
                className="bg-gray-900 border-gray-700 text-gray-300 pr-14"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400">USD</span>
              </div>
            </div>
          </div>

          {/* Destination Chain - Static Arbitrum */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-gray-300 font-medium">
              Destination Chain
            </Label>
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-md p-2.5">
              <Image
                src="/chains/arbitrum.png"
                alt="Arbitrum Chain"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-gray-300">{DESTINATION_CHAIN.label}</span>
            </div>
          </div>

          {/* Transaction Status Alerts */}
          {transactionError && (
            <Alert
              variant="destructive"
              className="bg-red-900/50 border-red-800 text-red-200"
            >
              <AlertDescription>{transactionError}</AlertDescription>
            </Alert>
          )}

          {transactionUrl && (
            <Alert className="bg-green-900/50 border-green-800 text-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-300" />
                <AlertDescription className="flex items-center justify-between w-full">
                  <span>Transaction submitted successfully!</span>
                  <a
                    href={transactionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-green-300 hover:text-green-100"
                  >
                    View <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Transfer Preview Card - only show when amount is filled */}
          {amount && !isProcessing && !transactionError && !transactionUrl && (
            <div className="bg-gray-900/40 rounded-md p-3 border border-gray-700/50">
              <div className="text-xs text-gray-400 mb-2">Transfer Preview</div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-900/30 text-indigo-300 border-indigo-800/60">
                    Ξ
                  </span>
                  <div>
                    <div className="text-gray-200 font-medium">
                      {amount} ETH
                    </div>
                    <div className="text-xs text-gray-400">
                      From Universal Account
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getTokenColorClasses(
                      DESTINATION_CHAIN.color
                    )}`}
                  >
                    {DESTINATION_CHAIN.icon}
                  </span>
                  <div>
                    <div className="text-gray-200 font-medium">
                      {DESTINATION_CHAIN.label}
                    </div>
                    <div className="text-xs text-gray-400">Destination</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isProcessing || !amount}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Deposit and Bridge
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t border-gray-700 bg-gray-800/30 px-6 py-4">
        <p className="text-xs text-gray-400 w-full text-center">
          Deposits are processed via Universal Account and bridged to Arbitrum
        </p>
      </CardFooter>
    </Card>
  );
}
