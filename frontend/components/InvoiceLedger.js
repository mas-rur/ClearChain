"use client";

import { formatUnits } from "ethers";
import { STATUS_LABELS } from "@/lib/contractConfig";

function shortHex(value) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export default function InvoiceLedger({ invoices, onRefresh, escrowAddress }) {
  return (
    <section className="ledger">
      <div className="ledger-head">
        <h2>Ledger</h2>
        <span className="ledger-count">
          {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
        </span>
      </div>

      {invoices.length === 0 ? (
        <p className="empty">No invoices yet — create one to get a payment link.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Pay link</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const total = BigInt(inv.baseAmount) + BigInt(inv.dustAmount);
              const payLink = `/pay/${inv.invoiceId}`;
              return (
                <tr key={inv.invoiceId}>
                  <td data-label="Invoice" className="mono">
                    {shortHex(inv.invoiceId)}
                  </td>
                  <td data-label="Amount" className="mono">
                    {formatUnits(total, 18)}
                  </td>
                  <td data-label="Status">
                    <span className={`status status-${STATUS_LABELS[inv.status].toLowerCase()}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td data-label="Pay link" className="mono">
                    <a href={payLink}>{payLink}</a>
                  </td>
                  <td data-label="">
                    <button className="btn-ghost" onClick={() => onRefresh(inv.invoiceId)}>
                      Refresh
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!escrowAddress && (
        <p className="hint">
          Set NEXT_PUBLIC_ESCROW_ADDRESS in .env.local to connect this to your deployed contract.
        </p>
      )}
    </section>
  );
}
