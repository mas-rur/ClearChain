// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ClearChainEscrow
/// @notice On-chain invoice + escrow contract for ClearChain. Buyers pay an
/// invoice's exact amount (base price + a unique "dust" signature) into
/// escrow; an authorized off-chain verification agent then releases the
/// funds to the merchant once it has independently confirmed the payment
/// is legitimate.
contract ClearChainEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    enum InvoiceStatus { Open, Paid, Fulfilled, Cancelled }

    struct Invoice {
        address merchant;
        address token;       // address(0) = native BNB
        uint256 baseAmount;
        uint256 dustAmount;  // unique per-invoice signature appended to baseAmount
        address payer;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 paidAt;
    }

    mapping(bytes32 => Invoice) public invoices;
    mapping(address => bool) public verifierAgents;

    event InvoiceCreated(bytes32 indexed invoiceId, address indexed merchant, address token, uint256 totalAmount);
    event PaymentReceived(bytes32 indexed invoiceId, address indexed payer, uint256 amount);
    event InvoiceFulfilled(bytes32 indexed invoiceId);
    event InvoiceCancelled(bytes32 indexed invoiceId);
    event VerifierUpdated(address indexed agent, bool allowed);

    constructor() Ownable(msg.sender) {}

    modifier onlyVerifier() {
        require(verifierAgents[msg.sender] || msg.sender == owner(), "not authorized verifier");
        _;
    }

    /// @notice Owner authorizes an address (the off-chain agent's wallet) to
    /// call fulfillInvoice().
    function setVerifier(address agent, bool allowed) external onlyOwner {
        verifierAgents[agent] = allowed;
        emit VerifierUpdated(agent, allowed);
    }

    /// @notice Merchant registers a new invoice with an off-chain-generated
    /// ID and a unique dust amount, so payments can be matched without
    /// needing a memo field.
    function createInvoice(
        bytes32 invoiceId,
        address token,
        uint256 baseAmount,
        uint256 dustAmount
    ) external {
        require(invoices[invoiceId].merchant == address(0), "invoice exists");
        require(baseAmount > 0, "zero amount");

        invoices[invoiceId] = Invoice({
            merchant: msg.sender,
            token: token,
            baseAmount: baseAmount,
            dustAmount: dustAmount,
            payer: address(0),
            status: InvoiceStatus.Open,
            createdAt: block.timestamp,
            paidAt: 0
        });

        emit InvoiceCreated(invoiceId, msg.sender, token, baseAmount + dustAmount);
    }

    /// @notice Pay an invoice in native BNB. Amount must match exactly.
    function payInvoiceNative(bytes32 invoiceId) external payable nonReentrant {
        Invoice storage inv = invoices[invoiceId];
        require(inv.status == InvoiceStatus.Open, "not open");
        require(inv.token == address(0), "not a native invoice");
        require(msg.value == inv.baseAmount + inv.dustAmount, "amount mismatch");

        inv.payer = msg.sender;
        inv.status = InvoiceStatus.Paid;
        inv.paidAt = block.timestamp;

        emit PaymentReceived(invoiceId, msg.sender, msg.value);
    }

    /// @notice Pay an invoice in an ERC20 token (e.g. USDT/USDC). Caller
    /// must approve() this contract for baseAmount + dustAmount first.
    function payInvoiceToken(bytes32 invoiceId) external nonReentrant {
        Invoice storage inv = invoices[invoiceId];
        require(inv.status == InvoiceStatus.Open, "not open");
        require(inv.token != address(0), "not a token invoice");

        uint256 total = inv.baseAmount + inv.dustAmount;
        IERC20(inv.token).safeTransferFrom(msg.sender, address(this), total);

        inv.payer = msg.sender;
        inv.status = InvoiceStatus.Paid;
        inv.paidAt = block.timestamp;

        emit PaymentReceived(invoiceId, msg.sender, total);
    }

    /// @notice Called by the off-chain agent once it has independently
    /// verified the payment (fraud checks, buyer risk score, etc). Releases
    /// escrowed funds to the merchant.
    function fulfillInvoice(bytes32 invoiceId) external onlyVerifier nonReentrant {
        Invoice storage inv = invoices[invoiceId];
        require(inv.status == InvoiceStatus.Paid, "not paid");

        inv.status = InvoiceStatus.Fulfilled;
        uint256 total = inv.baseAmount + inv.dustAmount;

        if (inv.token == address(0)) {
            (bool sent, ) = inv.merchant.call{value: total}("");
            require(sent, "native transfer failed");
        } else {
            IERC20(inv.token).safeTransfer(inv.merchant, total);
        }

        emit InvoiceFulfilled(invoiceId);
    }

    /// @notice Merchant (or owner) can cancel an invoice that hasn't been
    /// paid yet.
    function cancelInvoice(bytes32 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        require(msg.sender == inv.merchant || msg.sender == owner(), "not authorized");
        require(inv.status == InvoiceStatus.Open, "cannot cancel");

        inv.status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(invoiceId);
    }

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }
}
