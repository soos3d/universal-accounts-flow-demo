"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  UniversalAccount,
  IAssetsResponse,
  CHAIN_ID,
  SUPPORTED_PRIMARY_TOKENS,
} from "@GDdark/universal-account";

// Components
import { WalletConnection } from "@/app/components/WalletConnection";
//import { TransactionSection } from "@/app/components/TransactionSection";
import { DepositSection } from "@/app/components/DepositSection";
import { Button } from "@/components/ui/button";

export default function Home() {
  // State for wallet connection
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // State for Universal Account
  const [universalAccount, setUniversalAccount] =
    useState<UniversalAccount | null>(null);
  const [primaryAssets, setPrimaryAssets] = useState<IAssetsResponse | null>(
    null
  );
  const [accountInfo, setAccountInfo] = useState<{
    ownerAddress: string;
    evmSmartAccount: string;
    solanaSmartAccount: string;
  } | null>(null);

  // State for transactions
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactionUrl, setTransactionUrl] = useState<string>("");
  const [transactionError, setTransactionError] = useState<string>("");

  /**
   * Helper function to get the block explorer URL for a given chain
   */
  const getChainExplorer = (chain: string): string => {
    const explorers: Record<string, string> = {
      ethereum: "https://etherscan.io",
      arbitrum: "https://arbiscan.io",
      optimism: "https://optimistic.etherscan.io",
      polygon: "https://polygonscan.com",
      bsc: "https://bscscan.com",
      avalanche: "https://snowtrace.io",
      base: "https://basescan.org",
    };
    return explorers[chain] || "https://etherscan.io";
  };

  /**
   * Step 1: Connect Wallet
   * Handles the connection to MetaMask and requests account access
   */
  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask to use this dApp!");
      return;
    }

    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const accounts = await provider.listAccounts();
      setWalletAddress(accounts[0].address);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Handle wallet disconnection
   * Resets all states to their initial values
   */
  const disconnectWallet = () => {
    setWalletAddress("");
    setUniversalAccount(null);
    setPrimaryAssets(null);
    setAccountInfo(null);
    setTransactionUrl("");
    setTransactionError("");
  };

  /**
   * Step 2: Initialize Universal Account
   * Creates a new Universal Account instance when a wallet is connected
   */
  useEffect(() => {
    if (walletAddress) {
      if (!process.env.NEXT_PUBLIC_UA_PROJECT_ID) {
        console.error("NEXT_PUBLIC_UA_PROJECT_ID is not configured");
        return;
      }

      const ua = new UniversalAccount({
        projectId: process.env.NEXT_PUBLIC_UA_PROJECT_ID,
        ownerAddress: walletAddress,
        tradeConfig: {
          universalGas: false, // Don't use PARTI token for gas
        },
      });

      console.log("Universal Account initialized", ua);
      setUniversalAccount(ua);
    } else {
      setUniversalAccount(null);
    }
  }, [walletAddress]);

  /**
   * Step 3: Fetch Account Information
   * Retrieves account addresses and balances when the Universal Account is initialized
   */
  const fetchSmartAccountAddresses = useCallback(async () => {
    if (!universalAccount || !walletAddress) return;

    try {
      const smartAccountOptions =
        await universalAccount.getSmartAccountOptions();
      console.log("Smart account options:", smartAccountOptions);

      setAccountInfo({
        ownerAddress: walletAddress,
        evmSmartAccount: smartAccountOptions.smartAccountAddress || "",
        solanaSmartAccount: smartAccountOptions.solanaSmartAccountAddress || "",
      });

      // After getting the smart account addresses, fetch primary assets
      const assets = await universalAccount.getPrimaryAssets();
      console.log("Primary assets:", assets);
      setPrimaryAssets(assets);
    } catch (error) {
      console.error("Error fetching smart account addresses:", error);
    }
  }, [universalAccount, walletAddress]);

  useEffect(() => {
    fetchSmartAccountAddresses();
  }, [universalAccount, walletAddress, fetchSmartAccountAddresses]);

  /**
   * Handle deposit transaction using the Universal Account
   * This is a placeholder for the actual implementation
   */
  const handleDeposit = async (
    amount: string,
    destinationChain: string
  ) => {
    if (!universalAccount) return;

    try {
      setIsProcessing(true);
      setTransactionError("");
      setTransactionUrl("");

      // Placeholder for the transaction logic that will be added by the user
      console.log(`Depositing ${amount} ETH to ${destinationChain}`);

      // Call the Universal Account SDK to perform the deposit
      // This is a simulated response for now
      const txHash = "0x" + Math.random().toString(16).substr(2, 64);
      const chainExplorer = getChainExplorer(destinationChain);
      setTransactionUrl(`${chainExplorer}/tx/${txHash}`);

      // Refresh balances after transaction
      fetchSmartAccountAddresses();
    } catch (error) {
      console.error("Error executing deposit:", error);
      setTransactionError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white">
              Universal Account Deposit
            </h1>
            <p className="mt-2 text-gray-400">
              Deposit assets to your Universal Account and move them across
              chains
            </p>
          </div>

          {/* Explanatory Section */}
          <div className="mb-8 bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700 p-5">
            <h2 className="text-xl font-semibold text-white mb-2">
              How This Demo Works
            </h2>
            <div className="prose prose-sm prose-invert max-w-none">
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p className="bg-gray-700/30 p-3 rounded-md border border-gray-600">
                  <span className="font-semibold text-blue-400">
                    Key Concept:
                  </span>{" "}
                  This demo showcases the integration of Universal Accounts as a
                  dApp&apos;s deposit flow.
                </p>
                <p className="bg-gray-700/30 p-3 rounded-md border border-gray-600">
                  <span className="font-semibold text-blue-400">Focus:</span>{" "}
                  Our demo takes as an example an imaginary app that uses USDC
                  and USDT on Arbitrum. Users can leverage their Universal
                  Account to deposit these tokens from various chains directly
                  into the app.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-blue-400">
                    The Process:
                  </h3>
                  <ol className="space-y-1 list-decimal list-inside text-gray-300 text-sm">
                    <li>Connect your browser wallet</li>
                    <li>
                      You have assets on your EOA (USDC and USDT) on various
                      chains
                    </li>
                    <li>You need to deposit assets into the app to use it</li>
                    <li>
                      Instead of bridging, deposit assets into the Universal
                      Account
                    </li>
                    <li>
                      Select token (USDC or USDT), amount, and destination chain
                    </li>
                    <li>Send via Universal Account</li>
                    <li>
                      Receive funds on the destination chain automatically and
                      immediately
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-blue-400">
                    Benefits:
                  </h3>
                  <ul className="space-y-1 list-disc list-inside text-gray-300 text-sm">
                    <li>No need to think about networks</li>
                    <li>No manual bridging required</li>
                    <li>Simplified UX for cross-chain transactions</li>
                    <li>Single interface for multi-chain operations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Wallet Connection */}
            <div className="lg:col-span-1 space-y-4">
              {/* Wallet Connection */}
              <WalletConnection
                walletAddress={walletAddress}
                isConnecting={isConnecting}
                onConnect={connectWallet}
                onDisconnect={disconnectWallet}
                onWalletUpdate={setWalletAddress}
                universalAccount={accountInfo ? { evmSmartAccount: accountInfo.evmSmartAccount } : undefined}
              />
            </div>

            {/* Right Column: Deposit Form */}
            <div className="lg:col-span-2">
              {walletAddress && accountInfo ? (
                <DepositSection
                  isProcessing={isProcessing}
                  transactionError={transactionError}
                  transactionUrl={transactionUrl}
                  accountInfo={accountInfo}
                  primaryAssets={primaryAssets}
                  onDeposit={handleDeposit}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-8 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700">
                  <div className="text-center">
                    <h3 className="text-xl font-medium text-gray-200 mb-2">
                      Universal Accounts Deposit flow Demo
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Connect your wallet using the panel on the left to get
                      started
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
