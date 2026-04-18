// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProcurementRegistry
 * @notice Immutable on-chain registry for critical government procurement milestones.
 *         Each procurement is registered with its ID, title, and Approved Budget for
 *         the Contract (ABC). Critical lifecycle events are anchored as SHA-256 hashes
 *         so that any off-chain record can be independently verified against the chain.
 */
contract ProcurementRegistry {
    // ── Types ───────────────────────────────────────────

    enum EventType {
        ITB_POSTED,              // 0
        BID_SUBMITTED,           // 1
        BID_OPENING_COMPLETED,   // 2
        NOA_ISSUED,              // 3
        CONTRACT_SIGNED,         // 4
        PAYMENT_RECORDED,        // 5
        DOCUMENT_HASH_MISMATCH   // 6
    }

    struct Procurement {
        bytes32 id;
        string  title;
        uint256 abc;          // Approved Budget for the Contract (in wei-like units)
        uint256 registeredAt;
        bool    exists;
    }

    struct AnchoredEvent {
        bytes32   eventHash;
        EventType eventType;
        uint256   anchoredAt;
        bool      exists;
    }

    // ── State ───────────────────────────────────────────

    address public owner;

    /// procurement ID => Procurement
    mapping(bytes32 => Procurement) public procurements;

    /// procurement ID => event hash => AnchoredEvent
    mapping(bytes32 => mapping(bytes32 => AnchoredEvent)) public anchoredEvents;

    /// procurement ID => ordered list of event hashes
    mapping(bytes32 => bytes32[]) public eventHistory;

    uint256 public procurementCount;
    uint256 public eventCount;

    // ── Events ──────────────────────────────────────────

    event ProcurementRegistered(bytes32 indexed id, string title, uint256 abc, uint256 timestamp);
    event EventAnchored(bytes32 indexed procurementId, bytes32 eventHash, EventType eventType, uint256 timestamp);

    // ── Modifiers ───────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "ProcurementRegistry: caller is not the owner");
        _;
    }

    modifier procurementExists(bytes32 _id) {
        require(procurements[_id].exists, "ProcurementRegistry: procurement does not exist");
        _;
    }

    // ── Constructor ─────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ── Write Functions ─────────────────────────────────

    /**
     * @notice Register a new procurement on-chain.
     * @param _id    Unique procurement identifier (SHA-256 of reference number).
     * @param _title Human-readable project title.
     * @param _abc   Approved Budget for the Contract.
     */
    function registerProcurement(
        bytes32 _id,
        string calldata _title,
        uint256 _abc
    ) external onlyOwner {
        require(!procurements[_id].exists, "ProcurementRegistry: procurement already registered");
        require(_abc > 0, "ProcurementRegistry: ABC must be greater than zero");

        procurements[_id] = Procurement({
            id: _id,
            title: _title,
            abc: _abc,
            registeredAt: block.timestamp,
            exists: true
        });

        procurementCount++;

        emit ProcurementRegistered(_id, _title, _abc, block.timestamp);
    }

    /**
     * @notice Anchor a critical procurement event hash on-chain.
     * @param _procurementId The procurement this event belongs to.
     * @param _eventHash     SHA-256 hash of the off-chain event data.
     * @param _eventType     Category of the event.
     */
    function anchorEvent(
        bytes32 _procurementId,
        bytes32 _eventHash,
        EventType _eventType
    ) external onlyOwner procurementExists(_procurementId) {
        require(
            !anchoredEvents[_procurementId][_eventHash].exists,
            "ProcurementRegistry: event already anchored"
        );

        anchoredEvents[_procurementId][_eventHash] = AnchoredEvent({
            eventHash: _eventHash,
            eventType: _eventType,
            anchoredAt: block.timestamp,
            exists: true
        });

        eventHistory[_procurementId].push(_eventHash);
        eventCount++;

        emit EventAnchored(_procurementId, _eventHash, _eventType, block.timestamp);
    }

    // ── Read Functions ──────────────────────────────────

    /**
     * @notice Verify whether an event hash is anchored for a procurement.
     */
    function verifyEvent(
        bytes32 _procurementId,
        bytes32 _eventHash
    ) external view returns (bool) {
        return anchoredEvents[_procurementId][_eventHash].exists;
    }

    /**
     * @notice Get the number of anchored events for a procurement.
     */
    function getEventCount(bytes32 _procurementId) external view returns (uint256) {
        return eventHistory[_procurementId].length;
    }

    /**
     * @notice Get an anchored event's details.
     */
    function getEventDetail(
        bytes32 _procurementId,
        bytes32 _eventHash
    ) external view returns (EventType eventType, uint256 anchoredAt, bool exists) {
        AnchoredEvent storage evt = anchoredEvents[_procurementId][_eventHash];
        return (evt.eventType, evt.anchoredAt, evt.exists);
    }

    /**
     * @notice Get the event hash at a specific index in a procurement's history.
     */
    function getEventHashAtIndex(
        bytes32 _procurementId,
        uint256 _index
    ) external view returns (bytes32) {
        require(_index < eventHistory[_procurementId].length, "ProcurementRegistry: index out of bounds");
        return eventHistory[_procurementId][_index];
    }

    // ── Owner Management ────────────────────────────────

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "ProcurementRegistry: new owner is zero address");
        owner = _newOwner;
    }
}
