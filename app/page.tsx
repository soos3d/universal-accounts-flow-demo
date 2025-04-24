"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers, toBeHex, parseEther } from "ethers";
import {
  UniversalAccount,
  IAssetsResponse,
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
} from "@GDdark/universal-account";

// Components
import { WalletConnection } from "@/app/components/WalletConnection";
//import { TransactionSection } from "@/app/components/TransactionSection";
import { DepositSection } from "@/app/components/DepositSection";
import { ChevronDown, ChevronUp } from "lucide-react";

// Collapsible Section Component
const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-gray-800 bg-card text-card-foreground shadow overflow-hidden">
      <div
        className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-800 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium text-blue-400">{title}</h3>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-300 transition-colors"
          aria-label={isOpen ? "Close section" : "Open section"}
        >
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      {isOpen && <div className="text-gray-300">{children}</div>}
    </div>
  );
};

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
                {/* Key Concept Section */}
                <CollapsibleSection title="Key Concept" defaultOpen={true}>
                  <p className="text-sm text-gray-300 p-4 bg-gray-900">
                    This demo showcases the integration of Universal Accounts as
                    a dApp&apos;s deposit flow.
                  </p>
                </CollapsibleSection>
                {/* Focus Section */}
                <CollapsibleSection title="Focus" defaultOpen={true}>
                  <p className="text-sm text-gray-300 p-4 bg-gray-900">
                    Our demo takes as an example an imaginary app that uses BNB
                    on BNB Chain. Users can leverage their Universal Account to
                    deposit BNB from various chains directly into the app.
                  </p>
                </CollapsibleSection>
                {/* The Process Section */}
                <CollapsibleSection title="The Process" defaultOpen={false}>
                  <div className="p-4 pt-2 bg-gray-900">
                    <ol className="space-y-2 text-gray-300 text-sm pl-5 list-decimal bg-gray-900">
                      <li className="pl-1">Connect your browser wallet</li>
                      <li className="pl-1">
                        You have assets on your EOA (USDC and USDT) on various
                        chains
                      </li>
                      <li className="pl-1">
                        You need to deposit BNB into the app to use it
                      </li>
                      <li className="pl-1">
                        Instead of bridging, deposit assets (USDT or USDC) into
                        the Universal Account
                      </li>
                      <li className="pl-1">
                        Choose how many USD worth of BNB you want to deposit
                      </li>
                      <li className="pl-1">Send via Universal Account</li>
                      <li className="pl-1">
                        Receive funds on the destination chain automatically
                      </li>
                    </ol>
                  </div>
                </CollapsibleSection>
                <p>
                  In this scenario, we are using an in-app deposit flow to
                  transfer assets to the Universal Account. Alternatively, you
                  can simply send assets directly from your EOA (Externally
                  Owned Account) to the Universal Account. Any{" "}
                  <a
                    href="https://uasdev.mintlify.app/universal-accounts/cha/chains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    supported assets listed in the documentation
                  </a>{" "}
                  can be transferred this way.
                </p>{" "}
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
