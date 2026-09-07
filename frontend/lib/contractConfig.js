export const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "";

export const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

export const ESCROW_ABI = [
  "function createInvoice(bytes32 invoiceId, address token, uint256 baseAmount, uint256 dustAmount) external",
  "function payInvoiceNative(bytes32 invoiceId) external payable",
  "function payInvoiceToken(bytes32 invoiceId) external",
  "function getInvoice(bytes32 invoiceId) external view returns (tuple(address merchant, address token, uint256 baseAmount, uint256 dustAmount, address payer, uint8 status, uint256 createdAt, uint256 paidAt))",
  "event InvoiceCreated(bytes32 indexed invoiceId, address indexed merchant, address token, uint256 totalAmount)",
  "event PaymentReceived(bytes32 indexed invoiceId, address indexed payer, uint256 amount)",
  "event InvoiceFulfilled(bytes32 indexed invoiceId)",
];

export const STATUS_LABELS = ["Open", "Paid", "Fulfilled", "Cancelled"];

/// Random bytes32 invoice ID, generated client-side.
export function generateInvoiceId() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/// Small random wei signature appended to the base amount so each invoice's
/// total is uniquely matchable on-chain without a memo field.
export function generateDustAmount() {
  return BigInt(1 + Math.floor(Math.random() * 999));
}
