import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ExternalLink, DollarSign, Coins } from "lucide-react";

// Helper function to format addresses
const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to convert hex to decimal and format as USD
const formatUSD = (hexValue: string): string => {
  if (!hexValue || !hexValue.startsWith("0x")) return "0.00";

  try {
    // Convert hex to BigInt
    const wei = BigInt(hexValue);
    // Convert wei to ether (10^18)
    const ether = Number(wei) / 1e18;
    // Format as USD with 2 decimal places
    return `$${ether.toFixed(6)}`;
  } catch (e) {
    console.error("Error converting hex value:", e);
    return "Error";
  }
};

const TransactionParser = ({
  transactionPreview,
}: {
  transactionPreview: any;
}) => {
  const [parsedData, setParsedData] = useState<any>(null);
  console.log(parsedData);
  useEffect(() => {
    if (transactionPreview) {
      const { sender, receiver, depositTokens, lendingTokens, feeQuotes } =
        transactionPreview;

      const parsedDepositTokens = depositTokens?.map((dt: any) => ({
        name: dt.token?.name,
        symbol: dt.token?.symbol,
        amount: dt.amount,
        amountInUSD: dt.amountInUSD,
      }));

      const parsedLendingTokens = lendingTokens?.map((lt: any) => ({
        name: lt.token?.name,
        symbol: lt.token?.symbol,
        amount: lt.amount,
        amountInUSD: lt.amountInUSD,
      }));

      const fees = feeQuotes?.[0]?.fees?.totals;

      setParsedData({
        sender,
        receiver,
        depositTokens: parsedDepositTokens,
        lendingTokens: parsedLendingTokens,
        fees,
      });
    }
  }, [transactionPreview]);

  if (!parsedData)
    return (
      <div className="flex items-center justify-center p-3 text-gray-400 text-xs">
        <Coins className="mr-2 h-3 w-3 animate-pulse" />
        Analyzing transaction...
      </div>
    );

  const totalFee = Object.entries(parsedData.fees || {}).reduce(
    (acc, [key, value]) => {
      if (key === "feeTokenAmountInUSD" && typeof value === "string") {
        try {
          return acc + Number(BigInt(value) / BigInt(10 ** 15)) / 1000;
        } catch (e) {
          return acc;
        }
      }
      return acc;
    },
    0
  );

  return (
    <Card className="border-0 bg-gray-800/30">
      <CardContent className="p-3 space-y-3">
        {/* Addresses Section */}
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex justify-between items-center group relative">
            <div className="text-gray-400 text-xs">From</div>
            <div 
              className="font-mono text-gray-300 text-xs hover:text-gray-100 transition-colors cursor-default"
              title={parsedData.sender}
            >
              {formatAddress(parsedData.sender)}
            </div>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="h-3 w-3 text-gray-500" />
          </div>
          <div className="flex justify-between items-center group relative">
            <div className="text-gray-400 text-xs">To</div>
            <div 
              className="font-mono text-gray-300 text-xs hover:text-gray-100 transition-colors cursor-default"
              title={parsedData.receiver}
            >
              {formatAddress(parsedData.receiver)}
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-gray-700 my-2"></div>

        {/* Tokens Section */}
        <div className="space-y-2">
          {/* Deposit Tokens */}
          {parsedData.depositTokens?.length > 0 && (
            <div>
              <div className="text-gray-400 text-xs mb-1">You Pay</div>
              {parsedData.depositTokens.map((token: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Image
                      src={`/tokens/${token.symbol.toLowerCase()}.png`}
                      alt={token.symbol}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-gray-300 text-xs">
                      {token.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-300 text-xs">
                      {formatUSD(token.amountInUSD)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lending Tokens */}
          {parsedData.lendingTokens?.length > 0 && (
            <div>
              <div className="text-gray-400 text-xs mb-1">You Receive</div>
              {parsedData.lendingTokens.map((token: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Image
                      src={`/tokens/${token.symbol.toLowerCase()}.png`}
                      alt={token.symbol}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-gray-300 text-xs">
                      {token.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-300 text-xs">
                      {formatUSD(token.amountInUSD)}
                    </div>
                    <div className="text-gray-300 text-xs">
                      {`BNB  ${formatUSD(token.amount)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full h-px bg-gray-700 my-2"></div>

        {/* Fees Section - Simplified */}
        <div>
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-xs">Estimated Fee</div>
            <div className="text-purple-300 text-xs">
              ${totalFee.toFixed(6)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionParser;
