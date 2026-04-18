// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BidManager
 * @notice Enforces government procurement bidding rules on-chain using a
 *         commit-reveal scheme. Bids are sealed (committed) during the
 *         bidding period and revealed during bid opening. The contract
 *         enforces deadlines, ABC limits, and one-bid-per-vendor rules.
 */
contract BidManager {
    // ── Types ───────────────────────────────────────────

    enum BiddingStatus {
        NOT_STARTED, // 0
        OPEN,        // 1
        CLOSED,      // 2
        REVEALED     // 3
    }

    struct BiddingSession {
        bytes32        procurementId;
        uint256        abc;           // Approved Budget for the Contract
        uint256        deadline;      // Unix timestamp — no bids accepted after this
        BiddingStatus  status;
        address[]      bidders;
        address        lowestBidder;
        uint256        lowestAmount;
        bool           exists;
    }

    struct SealedBid {
        bytes32 commitHash;  // keccak256(abi.encodePacked(amount, salt))
        uint256 revealedAmount;
        bool    committed;
        bool    revealed;
        bool    compliant;   // amount <= ABC
    }

    // ── State ───────────────────────────────────────────

    address public owner;

    /// procurement ID => BiddingSession
    mapping(bytes32 => BiddingSession) public sessions;

    /// procurement ID => bidder address => SealedBid
    mapping(bytes32 => mapping(address => SealedBid)) public bids;

    // ── Events ──────────────────────────────────────────

    event BiddingOpened(bytes32 indexed procurementId, uint256 abc, uint256 deadline);
    event SealedBidSubmitted(bytes32 indexed procurementId, address indexed bidder, bytes32 commitHash);
    event BiddingClosed(bytes32 indexed procurementId, uint256 totalBids);
    event BidRevealed(bytes32 indexed procurementId, address indexed bidder, uint256 amount, bool compliant);
    event LowestBidDetermined(bytes32 indexed procurementId, address winner, uint256 amount);

    // ── Modifiers ───────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "BidManager: caller is not the owner");
        _;
    }

    // ── Constructor ─────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ── Bidding Lifecycle ───────────────────────────────

    /**
     * @notice Open a new bidding session for a procurement.
     * @param _procurementId  Unique procurement reference hash.
     * @param _abc            Approved Budget for the Contract.
     * @param _deadline       Unix timestamp after which no bids are accepted.
     */
    function openBidding(
        bytes32 _procurementId,
        uint256 _abc,
        uint256 _deadline
    ) external onlyOwner {
        require(!sessions[_procurementId].exists, "BidManager: session already exists");
        require(_abc > 0, "BidManager: ABC must be > 0");
        require(_deadline > block.timestamp, "BidManager: deadline must be in the future");

        sessions[_procurementId] = BiddingSession({
            procurementId: _procurementId,
            abc: _abc,
            deadline: _deadline,
            status: BiddingStatus.OPEN,
            bidders: new address[](0),
            lowestBidder: address(0),
            lowestAmount: 0,
            exists: true
        });

        emit BiddingOpened(_procurementId, _abc, _deadline);
    }

    /**
     * @notice Submit a sealed (committed) bid.
     * @param _procurementId  Procurement to bid on.
     * @param _commitHash     keccak256(abi.encodePacked(amount, salt))
     */
    function submitSealedBid(
        bytes32 _procurementId,
        bytes32 _commitHash
    ) external {
        BiddingSession storage session = sessions[_procurementId];
        require(session.exists, "BidManager: session does not exist");
        require(session.status == BiddingStatus.OPEN, "BidManager: bidding is not open");
        require(block.timestamp <= session.deadline, "BidManager: bidding deadline passed");
        require(!bids[_procurementId][msg.sender].committed, "BidManager: already submitted a bid");

        bids[_procurementId][msg.sender] = SealedBid({
            commitHash: _commitHash,
            revealedAmount: 0,
            committed: true,
            revealed: false,
            compliant: false
        });

        session.bidders.push(msg.sender);

        emit SealedBidSubmitted(_procurementId, msg.sender, _commitHash);
    }

    /**
     * @notice Close the bidding period. No more bids accepted.
     */
    function closeBidding(bytes32 _procurementId) external onlyOwner {
        BiddingSession storage session = sessions[_procurementId];
        require(session.exists, "BidManager: session does not exist");
        require(session.status == BiddingStatus.OPEN, "BidManager: bidding is not open");

        session.status = BiddingStatus.CLOSED;

        emit BiddingClosed(_procurementId, session.bidders.length);
    }

    /**
     * @notice Reveal a previously sealed bid. Called by the bridge on behalf of the bidder.
     * @param _procurementId  Procurement reference.
     * @param _bidder         Address of the original bidder.
     * @param _amount         The actual bid amount.
     * @param _salt           Random salt used during commitment.
     */
    function revealBid(
        bytes32 _procurementId,
        address _bidder,
        uint256 _amount,
        bytes32 _salt
    ) external onlyOwner {
        BiddingSession storage session = sessions[_procurementId];
        require(session.exists, "BidManager: session does not exist");
        require(session.status == BiddingStatus.CLOSED, "BidManager: bidding must be closed first");

        SealedBid storage bid = bids[_procurementId][_bidder];
        require(bid.committed, "BidManager: no sealed bid found");
        require(!bid.revealed, "BidManager: bid already revealed");

        // Verify commitment
        bytes32 computedHash = keccak256(abi.encodePacked(_amount, _salt));
        require(computedHash == bid.commitHash, "BidManager: commitment verification failed");

        bid.revealed = true;
        bid.revealedAmount = _amount;
        bid.compliant = (_amount <= session.abc && _amount > 0);

        // Track lowest compliant bid
        if (bid.compliant) {
            if (session.lowestBidder == address(0) || _amount < session.lowestAmount) {
                session.lowestBidder = _bidder;
                session.lowestAmount = _amount;
            }
        }

        emit BidRevealed(_procurementId, _bidder, _amount, bid.compliant);
    }

    /**
     * @notice Finalize the reveal phase and determine the lowest compliant bid.
     */
    function finalizeReveals(bytes32 _procurementId) external onlyOwner {
        BiddingSession storage session = sessions[_procurementId];
        require(session.exists, "BidManager: session does not exist");
        require(session.status == BiddingStatus.CLOSED, "BidManager: bidding must be closed");

        session.status = BiddingStatus.REVEALED;

        if (session.lowestBidder != address(0)) {
            emit LowestBidDetermined(_procurementId, session.lowestBidder, session.lowestAmount);
        }
    }

    // ── Read Functions ──────────────────────────────────

    /**
     * @notice Get the lowest compliant bid for a procurement.
     */
    function getLowestCompliantBid(
        bytes32 _procurementId
    ) external view returns (address bidder, uint256 amount) {
        BiddingSession storage session = sessions[_procurementId];
        require(session.exists, "BidManager: session does not exist");
        return (session.lowestBidder, session.lowestAmount);
    }

    /**
     * @notice Get the number of bidders for a procurement.
     */
    function getBidderCount(bytes32 _procurementId) external view returns (uint256) {
        return sessions[_procurementId].bidders.length;
    }

    /**
     * @notice Get a bidder address by index.
     */
    function getBidderAtIndex(
        bytes32 _procurementId,
        uint256 _index
    ) external view returns (address) {
        require(_index < sessions[_procurementId].bidders.length, "BidManager: index out of bounds");
        return sessions[_procurementId].bidders[_index];
    }

    /**
     * @notice Get the session status.
     */
    function getSessionStatus(
        bytes32 _procurementId
    ) external view returns (BiddingStatus) {
        return sessions[_procurementId].status;
    }

    // ── Owner Management ────────────────────────────────

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "BidManager: new owner is zero address");
        owner = _newOwner;
    }
}
