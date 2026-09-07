# ClearChain

Autonomous on-chain payment verification & escrow for BNB Chain.

Buyers pay an exact-amount invoice (base price + a unique "dust" signature)
into an escrow smart contract. An off-chain AI verification agent watches
for `PaymentReceived` events, runs its checks, then calls `fulfillInvoice()`
to release the funds to the merchant — no manual reconciliation, no
centralized payment processor.

## Why

Crypto merchants on BSC either rely on centralized processors or hand-roll
fragile manual verification: generate a reference ID, wait for a payment,
manually check the chain, grant access. ClearChain automates that whole
loop while keeping funds trustlessly escrowed until verification passes.

## Architecture

- `contracts/ClearChainEscrow.sol` — invoice creation, escrowed payment in
  native BNB or an ERC20 (USDT/USDC), and agent-gated fulfillment.
- `agent/matcher.js` — Node.js service that listens for `PaymentReceived`
  events, runs verification checks, and calls `fulfillInvoice()`.
- `scripts/deploy.js` — deploys the contract to BSC testnet or mainnet.
- `frontend/` — Next.js dashboard: merchants connect a wallet, create
  invoices, and get a shareable `/pay/[invoiceId]` link; buyers open that
  link to pay directly from their own wallet.

## Setup

Contracts + agent:

```bash
npm install
cp .env.example .env   # fill in your RPC URL, deployer key, agent key
npm run compile
npm run deploy:testnet
npm run agent
```

After deploying, call `setVerifier(agentAddress, true)` from the owner
account so the agent wallet is authorized to release funds.

Frontend:

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_ESCROW_ADDRESS
npm run dev
```

Open `http://localhost:3000`, connect a wallet (MetaMask or Binance Wallet)
on BSC testnet, and create an invoice.

## Demo flow

1. Merchant connects their wallet on the dashboard and creates an invoice —
   this calls `createInvoice()` with a base amount + unique dust amount.
2. The dashboard shows a `/pay/[invoiceId]` link. The buyer opens it,
   connects their own wallet, and pays the exact total — this calls
   `payInvoiceNative()` or `payInvoiceToken()`, moving funds into escrow.
3. The agent picks up the on-chain `PaymentReceived` event, runs its
   checks, and calls `fulfillInvoice()` to release funds to the merchant.
4. The merchant's ledger updates from Open → Paid → Fulfilled.

## Honest current limitations

This is a hackathon-stage build, not production-ready:

- The dashboard tracks a merchant's own invoices in browser `localStorage`
  — there's no backend/indexer yet, so invoices don't sync across devices
  or browsers. A real version would index `InvoiceCreated` events server-side.
- The agent's verification step (`runVerificationChecks` in `matcher.js`)
  is a stub that always passes — swap in real fraud/risk logic before
  trusting it with real funds.
- No automated tests yet for the contract. Add Hardhat tests before mainnet
  use, especially around reentrancy and the ERC20 transfer paths.
- Recommended for BSC testnet during the hackathon; audit before mainnet.

## Hackathon track fit

Payments / DeFi (escrowed, trustless settlement) and AI Agents (agent
wallet gates fund release; drop-in ready for the BNB AI Agent SDK).

## Next steps

- Merchant dashboard (Next.js) to create invoices and watch status live
- Replace the verification stub in `agent/matcher.js` with a real risk model
- Mint a receipt NFT on `InvoiceFulfilled` as proof-of-purchase
