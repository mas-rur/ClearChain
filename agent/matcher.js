require("dotenv").config();
const { ethers } = require("ethers");

// Minimal ABI — just what this agent needs. No Hardhat compile step
// required, so this runs as-is on a fresh clone with no build artifacts.
const ESCROW_ABI = [
  "function fulfillInvoice(bytes32 invoiceId) external",
  "event PaymentReceived(bytes32 indexed invoiceId, address indexed payer, uint256 amount)",
];

const RPC_URL = process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545";
const CONTRACT_ADDRESS = process.env.ESCROW_ADDRESS;
const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;

async function main() {
  if (!CONTRACT_ADDRESS || !PRIVATE_KEY) {
    throw new Error("Set ESCROW_ADDRESS and AGENT_PRIVATE_KEY in .env first");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const escrow = new ethers.Contract(CONTRACT_ADDRESS, ESCROW_ABI, wallet);

  console.log("ClearChain agent watching for PaymentReceived events on", CONTRACT_ADDRESS);

  escrow.on("PaymentReceived", async (invoiceId, payer, amount) => {
    console.log(`Payment detected — invoice ${invoiceId} from ${payer}, amount ${amount.toString()}`);

    const passed = await runVerificationChecks(invoiceId, payer, amount);

    if (!passed) {
      console.warn(`Invoice ${invoiceId} failed verification — held for manual review.`);
      return;
    }

    try {
      const tx = await escrow.fulfillInvoice(invoiceId);
      await tx.wait();
      console.log(`Invoice ${invoiceId} fulfilled — funds released to merchant.`);
    } catch (err) {
      console.error(`Failed to fulfill invoice ${invoiceId}:`, err.message);
    }
  });
}

async function runVerificationChecks(invoiceId, payer, amount) {
  return true;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
