"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BrowserProvider, Contract, formatUnits } from "ethers";
import { ESCROW_ADDRESS, ESCROW_ABI, STATUS_LABELS, NATIVE_TOKEN } from "@/lib/contractConfig";

export default function PayInvoicePage() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [status, setStatus] = useState("Loading invoice…");

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const loadInvoice = async () => {
    if (!window.ethereum || !ESCROW_ADDRESS) {
      setStatus("Wallet or contract address not configured.");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      const inv = await contract.getInvoice(invoiceId);
      setInvoice(inv);
      setStatus("");
    } catch (err) {
      setStatus("Could not load this invoice.");
    }
  };

  const pay = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const total = invoice.baseAmount + invoice.dustAmount;

      setStatus("Confirm the payment in your wallet…");
      const tx =
        invoice.token === NATIVE_TOKEN
          ? await contract.payInvoiceNative(invoiceId, { value: total })
          : await contract.payInvoiceToken(invoiceId);
      await tx.wait();
      setStatus("Payment sent — waiting for the merchant to confirm.");
      loadInvoice();
    } catch (err) {
      setStatus(err.shortMessage || err.message || "Payment failed.");
    }
  };

  if (!invoice) {
    return (
      <main className="page pay-page">
        <div className="wordmark">ClearChain</div>
        <p className="status-line">{status}</p>
      </main>
    );
  }

  const total = invoice.baseAmount + invoice.dustAmount;
  const statusIndex = Number(invoice.status);

  return (
    <main className="page pay-page">
      <div className="wordmark">ClearChain</div>
      <section className="ticket">
        <h2>Invoice</h2>
        <p className="mono small">{invoiceId}</p>
        <p className="amount-due">{formatUnits(total, 18)}</p>
        <p className="hint">
          Send this exact amount — the last few digits are a unique signature that lets the
          invoice be matched automatically.
        </p>
        <p>
          Status: <span className={`status status-${STATUS_LABELS[statusIndex].toLowerCase()}`}>{STATUS_LABELS[statusIndex]}</span>
        </p>
        {statusIndex === 0 && (
          <button className="btn-primary" onClick={pay}>
            Pay {formatUnits(total, 18)}
          </button>
        )}
        {status && <p className="status-line">{status}</p>}
      </section>
    </main>
  );
}
