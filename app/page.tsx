"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  UniversalAccount,
  IAssetsResponse,
} from "@particle-network/universal-account-sdk";

// Components
import { WalletConnection } from "@/app/components/WalletConnection";
import { DepositSection } from "@/app/components/DepositSection";

// UI Components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white">
              Universal Account Deposit Flow Demo
            </h1>
            <p className="mt-2 text-gray-400">
              Deposit assets to your Universal Account and move them across
              chains
            </p>
          </div>

          {/* Explanatory Section */}
          <div className="mb-8 bg-gray-800 backdrop-blur-sm rounded-lg p-5">
            <h2 className="text-xl font-semibold text-white mb-2">
              How This Demo Works
            </h2>
            <div className="prose prose-sm prose-invert max-w-none">
              {/* Collapsible sections */}
              <div className="space-y-4 text-gray-300 leading-relaxed">
                {/* Explanatory Sections using shadcn Accordion */}
                <Accordion
                  type="multiple"
                  defaultValue={["key-concept", "focus"]}
                  className="space-y-4"
                >
                  {/* Key Concept Section */}
                  <AccordionItem
                    value="key-concept"
                    className="border-gray-600"
                  >
                    <AccordionTrigger>
                      <span className="text-blue-400">Key Concept</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-gray-300 p-4 bg-gray-900 rounded">
                        This demo showcases the integration of Universal
                        Accounts as a dApp&apos;s deposit flow.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Focus Section */}
                  <AccordionItem value="focus" className="border-gray-600">
                    <AccordionTrigger>
                      <span className="text-blue-400">Focus</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-gray-300 p-4 bg-gray-900 rounded">
                        Our demo takes as an example an imaginary app that uses
                        BNB on BNB Chain. Users can leverage their Universal
                        Account to deposit BNB from various chains directly into
                        the app.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* The Process Section */}
                  <AccordionItem value="process" className="border-gray-600">
                    <AccordionTrigger>
                      <span className="text-blue-400">The Process</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 bg-gray-900 rounded">
                        <ol className="space-y-2 text-gray-300 text-sm pl-5 list-decimal">
                          <li>Connect your browser wallet</li>
                          <li>
                            You have assets on your EOA (USDC and USDT) on
                            various chains
                          </li>
                          <li>
                            You need to deposit BNB into the app to use it
                          </li>
                          <li>
                            Instead of bridging, deposit assets (USDT or USDC)
                            into the Universal Account
                          </li>
                          <li>
                            Choose how many USD worth of BNB you want to deposit
                          </li>
                          <li>Send via Universal Account</li>
                          <li>
                            Receive funds on the destination chain automatically
                          </li>
                        </ol>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <p className="text-gray-300 text-sm">
                  In this scenario, we are using an in-app deposit flow to
                  transfer assets to the Universal Account. Alternatively, you
                  can simply send assets directly from your EOA (Externally
                  Owned Account) to the Universal Account. Any{" "}
                  <a
                    href="https://uasdev.mintlify.app/universal-accounts/cha/chains#primary-assets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    supported assets listed in the documentation
                  </a>{" "}
                  can be transferred this way.
                </p>{" "}
              </div>
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
                <p className="text-blue-400 text-sm">
                  Check out the Particle Docs{" "}
                  <a
                    href="https://uasdev.mintlify.app/universal-accounts/cha/how-to/deposit-flow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:underline"
                  >
                    for a full guide
                  </a>
                  .
                </p>
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
                universalAccount={
                  accountInfo
                    ? { evmSmartAccount: accountInfo.evmSmartAccount }
                    : undefined
                }
              />
            </div>

            {/* Right Column: Deposit Form */}
            <div className="lg:col-span-2">
              {walletAddress && accountInfo ? (
                <DepositSection
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  transactionError={transactionError}
                  setTransactionError={setTransactionError}
                  transactionUrl={transactionUrl}
                  setTransactionUrl={setTransactionUrl}
                  accountInfo={accountInfo}
                  primaryAssets={primaryAssets}
                  universalAccount={universalAccount}
                  walletAddress={walletAddress}
                  refreshBalances={fetchSmartAccountAddresses}
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
