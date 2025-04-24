"use client";

import type React from "react";

import { useState } from "react";
import { ethers, toBeHex, parseEther } from "ethers";
import TransactionParser from "./TransactionParser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
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
import {
  IAssetsResponse,
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
} from "@GDdark/universal-account";

interface DepositSectionProps {
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  transactionError: string;
  setTransactionError: (error: string) => void;
  transactionUrl: string;
  setTransactionUrl: (url: string) => void;
  accountInfo: {
    ownerAddress: string;
    evmSmartAccount: string;
    solanaSmartAccount: string;
  };
  primaryAssets: IAssetsResponse | null;
  universalAccount: any;
  walletAddress: string;
  refreshBalances: () => Promise<void>;
}

// PARTI token info
const BNB_TOKEN = {
  value: "bnb",
  label: "BNB",
  address: "0x0000000000000000000000000000000000000000",
  icon: "/tokens/bnb.png",
  color: "yellow",
};

export function DepositSection({
  isProcessing,
  setIsProcessing,
  transactionError,
  setTransactionError,
  transactionUrl,
  setTransactionUrl,
  accountInfo,
  primaryAssets,
  universalAccount,
  walletAddress,
  refreshBalances,
}: DepositSectionProps) {
  const [amount, setAmount] = useState<string>("");
  const [copiedEVM, setCopiedEVM] = useState(false);
  const [transactionPreview, setTransactionPreview] = useState<any>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  /**
   * Generate transaction preview when amount changes
   */
  /**
   * Helper function to check if the transaction preview has minimal required data
   */
  const hasPreviewData = (preview: any): boolean => {
    //console.log("@@@Preview:", JSON.stringify(preview));
    return !!(preview && preview.sender && preview.receiver);
  };

  const generateTransactionPreview = async (amount: string) => {
    if (!universalAccount || !walletAddress || !primaryAssets || !amount) {
      setTransactionPreview(null);
      return;
    }

    try {
      setIsGeneratingPreview(true);

      // Get BNB price from primaryAssets
      const bnbPrice = primaryAssets.assets[5].price;

      // Convert USD amount to BNB amount
      // amount is in USD, divide by BNB price to get equivalent BNB amount
      const bnbAmount = (parseFloat(amount) / bnbPrice).toFixed(8);

      console.log(
        `Generating preview for swapping ${amount} USD (${bnbAmount} BNB) and transferring to ${walletAddress}`
      );

      const transaction = await universalAccount.createUniversalTransaction({
        chainId: CHAIN_ID.BSC_MAINNET,
        // Use the calculated BNB amount based on USD value
        expectTokens: [
          {
            type: SUPPORTED_TOKEN_TYPE.BNB,
            amount: bnbAmount,
          },
        ],
        transactions: [
          {
            to: walletAddress,
            data: "0x",
            value: toBeHex(parseEther(bnbAmount)),
          },
        ],
      });

      console.log("Preview transaction created", transaction);

      // Store the transaction preview data
      console.log("Setting transaction preview");
      setTransactionPreview(transaction);
    } catch (error) {
      console.error("Error generating transaction preview:", error);
      setTransactionPreview(null);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  /**
   * Handle token swap and transfer back to EOA wallet using the Universal Account
   */
  const handleDeposit = async (amount: string, tokenSymbol: string) => {
    if (!universalAccount || !walletAddress || !transactionPreview) return;

    try {
      setIsProcessing(true);
      setTransactionError("");
      setTransactionUrl("");

      console.log("Executing the previewed transaction");

      // Get wallet instance for signing
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Sign and send the transaction
      const messageBytes = ethers.getBytes(transactionPreview.rootHash);
      const signature = await signer.signMessage(messageBytes);
      const sendResult = await universalAccount.sendTransaction(
        transactionPreview,
        signature
      );

      console.log("Transaction result:", sendResult);

      // Set the transaction URL to the Universal Explorer
      setTransactionUrl(
        `https://universalx.app/activity/details?id=${sendResult.transactionId}`
      );

      // Reset the transaction preview
      setTransactionPreview(null);

      // Refresh balances after transaction
      refreshBalances();
    } catch (error) {
      console.error("Error executing token swap:", error);
      setTransactionError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transactionPreview) {
      handleDeposit(amount, "USDC");
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

  console.log("@@@Primary assets:", primaryAssets?.assets[5].price);

  return (
    <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-purple-400" />
              BNB Token Swap
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Use USDT or USDC on any chain to swap for BNB token and send it
              back to your EOA.
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
          {/* Amount input */}
          <div className="space-y-1">
            <Label className="text-gray-300 font-medium" htmlFor="amount">
              Amount to Swap (USD)
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                $
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  const newAmount = e.target.value;
                  setAmount(newAmount);
                  if (newAmount && parseFloat(newAmount) > 0) {
                    generateTransactionPreview(newAmount);
                  } else {
                    setTransactionPreview(null);
                  }
                }}
                className="text-gray-300 pl-7 transition-all bg-gray-800/40 border-gray-700/60 focus-visible:ring-blue-500"
                min="0"
                step="any"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Target Token - Static BNB */}
          <div className="space-y-2">
            <Label htmlFor="targetToken" className="text-gray-300 font-medium">
              Target Token
            </Label>
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-md p-2.5">
              <Image
                src={BNB_TOKEN.icon}
                alt={BNB_TOKEN.label}
                width={24}
                height={24}
                className="rounded-full"
              />
              <div className="flex-1">
                <span className="text-gray-300">{BNB_TOKEN.label}</span>
                <div className="text-xs text-gray-400 font-mono mt-1">
                  {BNB_TOKEN.address.substring(0, 6)}...
                  {BNB_TOKEN.address.substring(BNB_TOKEN.address.length - 4)}
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-purple-900/30 text-purple-300 border-purple-800/60 px-2 py-0 text-xs"
              >
                Fixed
              </Badge>
            </div>
          </div>

          {/* Destination Address */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-gray-300 font-medium">
              Destination Address
            </Label>
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-md p-2.5">
              <Wallet className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300 font-mono text-sm">
                {formatAddress(accountInfo.ownerAddress)}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Tokens will be sent back to your EOA wallet
            </p>
          </div>

          {/* Transaction Preview */}
          {transactionPreview && hasPreviewData(transactionPreview) && (
            <div className="mt-4 p-3 border border-gray-700 rounded-md bg-gray-800/50">
              <h3 className="font-medium text-sm text-gray-300 mb-2">
                Transaction Preview
              </h3>
              <TransactionParser transactionPreview={transactionPreview} />
            </div>
          )}

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

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              isProcessing ||
              !transactionPreview ||
              !hasPreviewData(transactionPreview) ||
              isGeneratingPreview
            }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isGeneratingPreview ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                Confirm Swap
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t border-gray-700 bg-gray-800/30 px-6 py-4">
        <p className="text-xs text-gray-400 w-full text-center">
          You automatically receive BNB to your EOA wallet even if you
          don&apos;t hold any or don&apos;t hold any assets on BNB Chain.
        </p>
      </CardFooter>
    </Card>
  );
}
