export default function Header({ account, chainId, onConnect }) {
  const short = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : null;
  const networkLabel =
    chainId === 56 ? "BNB Mainnet" : chainId === 97 ? "BNB Testnet" : chainId ? `Chain ${chainId}` : null;

  return (
    <header className="header">
      <div className="wordmark">ClearChain</div>
      <div className="header-right">
        {networkLabel && <span className="network-badge">{networkLabel}</span>}
        <button className="btn-primary" onClick={onConnect}>
          {short || "Connect wallet"}
        </button>
      </div>
    </header>
  );
}
