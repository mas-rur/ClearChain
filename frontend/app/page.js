"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatUnits } from "ethers";
import {
  ESCROW_ADDRESS,
  ESCROW_ABI,
  NATIVE_TOKEN,
  generateInvoiceId,
  generateDustAmount,
} from "@/lib/contractConfig";
import Header from "@/components/Header";
import CreateInvoicePanel from "@/components/CreateInvoicePanel";
import InvoiceLedger from "@/components/InvoiceLedger";

const STORAGE_KEY = "clearchain:invoices";

export default function DashboardPage() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setInvoices(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.on("accountsChanged", (accs) => setAccount(accs[0] || null));
    window.ethereum.on("chainChanged", () => window.location.reload());
  }, []);

  const persist = (list) => {
    setInvoices(list);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setStatus("No wallet found — install MetaMask or Binance Wallet.");
      return;
    }
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    setAccount(accounts[0]);
    setChainId(Number(network.chainId));
  }, []);

  const createInvoice = async ({ amount, tokenAddress }) => {
    if (!account) {
      setStatus("Connect your wallet first.");
      return;
    }
    if (!ESCROW_ADDRESS) {
      setStatus("Set NEXT_PUBLIC_ESCROW_ADDRESS in .env.local first.");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

      const invoiceId = generateInvoiceId();
      const dustAmount = generateDustAmount();
      const token = tokenAddress || NATIVE_TOKEN;
      const baseAmount = BigInt(Math.round(parseFloat(amount) * 1e18));

      setStatus("Confirm the transaction in your wallet…");
      const tx = await contract.createInvoice(invoiceId, token, baseAmount, dustAmount);
      await tx.wait();

      const record = {
        invoiceId,
        token,
        baseAmount: baseAmount.toString(),
        dustAmount: dustAmount.toString(),
        status: 0,
        createdAt: Date.now(),
      };
      persist([record, ...invoices]);
      setStatus(`Invoice created — total due ${formatUnits(baseAmount + dustAmount, 18)}.`);
    } catch (err) {
      setStatus(err.shortMessage || err.message || "Failed to create invoice.");
    }
  };

  const refreshInvoice = async (invoiceId) => {
    if (!ESCROW_ADDRESS || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      const inv = await contract.getInvoice(invoiceId);
      const updated = invoices.map((i) =>
        i.invoiceId === invoiceId ? { ...i, status: Number(inv.status) } : i
      );
      persist(updated);
    } catch (err) {
      setStatus("Could not refresh that invoice.");
    }
  };

  return (
    <main className="page">
      <Header account={account} chainId={chainId} onConnect={connectWallet} />
      <div className="layout">
        <CreateInvoicePanel onCreate={createInvoice} disabled={!account} />
        <InvoiceLedger invoices={invoices} onRefresh={refreshInvoice} escrowAddress={ESCROW_ADDRESS} />
      </div>
      {status && <p className="status-line">{status}</p>}
    </main>
  );
}
