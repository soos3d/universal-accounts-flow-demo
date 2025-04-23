interface TransactionSectionProps {
  isTransferring: boolean;
  transactionError: string;
  transactionUrl: string;
  onBuyClick: () => void;
}

/**
 * TransactionSection Component
 * Handles the transaction UI including:
 * - Buy button
 * - Loading state
 * - Error display
 * - Transaction success with link
 */
export function TransactionSection({
  isTransferring,
  transactionError,
  transactionUrl,
  onBuyClick,
}: TransactionSectionProps) {
  return (
    <div className="mt-6 space-y-4">
      <button
        onClick={onBuyClick}
        disabled={isTransferring}
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium
                 hover:bg-green-700 transition-all duration-200 ease-in-out
                 disabled:opacity-50 disabled:cursor-not-allowed w-full"
      >
        {isTransferring ? "Processing Transaction..." : "Buy BNB ($0.1)"}
      </button>

      {transactionError && (
        <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
          {transactionError}
        </div>
      )}

      {transactionUrl && !transactionError && (
        <div className="p-4 bg-green-900/30 border border-green-800 rounded-lg">
          <div className="text-green-400 font-medium text-sm mb-2">
            Transaction Submitted!
          </div>
          <a
            href={transactionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            View Transaction Details →
          </a>
        </div>
      )}
    </div>
  );
}
