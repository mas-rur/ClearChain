"use client";

import { useState } from "react";

export default function CreateInvoicePanel({ onCreate, disabled }) {
  const [amount, setAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;
    onCreate({ amount, tokenAddress: tokenAddress || null });
    setAmount("");
  };

  return (
    <section className="ticket">
      <h2>New invoice</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Amount due
          <input
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.05"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label>
          Token address (leave blank for native BNB)
          <input
            type="text"
            placeholder="0x… USDT / USDC"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary" disabled={disabled}>
          Create invoice
        </button>
        {disabled && <p className="hint">Connect your wallet to create an invoice.</p>}
      </form>
    </section>
  );
}
