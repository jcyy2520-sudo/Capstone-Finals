// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PaymentTracker
 * @notice Tracks contract payment milestones on-chain for government procurement.
 *         Ensures transparent, immutable recording of payment disbursements
 *         against awarded contracts.
 */
contract PaymentTracker {
    // ── Types ───────────────────────────────────────────

    struct ContractRecord {
        bytes32 contractId;
        bytes32 procurementId;
        address vendor;
        uint256 totalAmount;
        uint256 totalPaid;
        bool    completed;
        bool    exists;
        uint8   milestoneCount;
    }

    struct Milestone {
        string  description;
        uint256 amount;
        uint256 paidAmount;
        bool    fullyPaid;
    }

    // ── State ───────────────────────────────────────────

    address public owner;

    /// contract ID => ContractRecord
    mapping(bytes32 => ContractRecord) public contracts;

    /// contract ID => milestone index => Milestone
    mapping(bytes32 => mapping(uint8 => Milestone)) public milestones;

    uint256 public contractCount;
    uint256 public totalPaymentsRecorded;

    // ── Events ──────────────────────────────────────────

    event ContractRegistered(bytes32 indexed contractId, bytes32 indexed procurementId, address vendor, uint256 totalAmount);
    event MilestoneAdded(bytes32 indexed contractId, uint8 milestoneIndex, string description, uint256 amount);
    event PaymentRecorded(bytes32 indexed contractId, uint8 milestoneIndex, uint256 amount, uint256 totalPaid);
    event ContractCompleted(bytes32 indexed contractId, uint256 totalPaid);

    // ── Modifiers ───────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "PaymentTracker: caller is not the owner");
        _;
    }

    modifier contractExists(bytes32 _contractId) {
        require(contracts[_contractId].exists, "PaymentTracker: contract does not exist");
        _;
    }

    // ── Constructor ─────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ── Write Functions ─────────────────────────────────

    /**
     * @notice Register an awarded contract on-chain.
     * @param _contractId     Unique contract identifier hash.
     * @param _procurementId  Parent procurement reference.
     * @param _vendor         Vendor/supplier wallet address.
     * @param _totalAmount    Total contract value.
     */
    function registerContract(
        bytes32 _contractId,
        bytes32 _procurementId,
        address _vendor,
        uint256 _totalAmount
    ) external onlyOwner {
        require(!contracts[_contractId].exists, "PaymentTracker: contract already registered");
        require(_vendor != address(0), "PaymentTracker: vendor is zero address");
        require(_totalAmount > 0, "PaymentTracker: amount must be > 0");

        contracts[_contractId] = ContractRecord({
            contractId: _contractId,
            procurementId: _procurementId,
            vendor: _vendor,
            totalAmount: _totalAmount,
            totalPaid: 0,
            completed: false,
            exists: true,
            milestoneCount: 0
        });

        contractCount++;

        emit ContractRegistered(_contractId, _procurementId, _vendor, _totalAmount);
    }

    /**
     * @notice Add a payment milestone to a contract.
     * @param _contractId  Contract to add milestone to.
     * @param _description Milestone description.
     * @param _amount      Expected payment amount for this milestone.
     */
    function addMilestone(
        bytes32 _contractId,
        string calldata _description,
        uint256 _amount
    ) external onlyOwner contractExists(_contractId) {
        ContractRecord storage c = contracts[_contractId];
        require(!c.completed, "PaymentTracker: contract already completed");
        require(_amount > 0, "PaymentTracker: milestone amount must be > 0");

        uint8 index = c.milestoneCount;
        milestones[_contractId][index] = Milestone({
            description: _description,
            amount: _amount,
            paidAmount: 0,
            fullyPaid: false
        });

        c.milestoneCount++;

        emit MilestoneAdded(_contractId, index, _description, _amount);
    }

    /**
     * @notice Record a payment against a milestone.
     * @param _contractId     Contract reference.
     * @param _milestoneIndex Index of the milestone being paid.
     * @param _amount         Payment amount.
     */
    function recordPayment(
        bytes32 _contractId,
        uint8 _milestoneIndex,
        uint256 _amount
    ) external onlyOwner contractExists(_contractId) {
        ContractRecord storage c = contracts[_contractId];
        require(!c.completed, "PaymentTracker: contract already completed");
        require(_milestoneIndex < c.milestoneCount, "PaymentTracker: invalid milestone index");
        require(_amount > 0, "PaymentTracker: payment amount must be > 0");

        Milestone storage m = milestones[_contractId][_milestoneIndex];
        require(!m.fullyPaid, "PaymentTracker: milestone already fully paid");
        require(m.paidAmount + _amount <= m.amount, "PaymentTracker: payment exceeds milestone amount");

        // Effects
        m.paidAmount += _amount;
        if (m.paidAmount == m.amount) {
            m.fullyPaid = true;
        }

        c.totalPaid += _amount;
        require(c.totalPaid <= c.totalAmount, "PaymentTracker: total payments exceed contract amount");

        totalPaymentsRecorded++;

        // Check if contract is fully paid
        if (c.totalPaid == c.totalAmount) {
            c.completed = true;
            emit ContractCompleted(_contractId, c.totalPaid);
        }

        emit PaymentRecorded(_contractId, _milestoneIndex, _amount, c.totalPaid);
    }

    // ── Read Functions ──────────────────────────────────

    /**
     * @notice Get contract payment status.
     */
    function getContractStatus(
        bytes32 _contractId
    ) external view returns (uint256 total, uint256 paid, bool completed) {
        ContractRecord storage c = contracts[_contractId];
        require(c.exists, "PaymentTracker: contract does not exist");
        return (c.totalAmount, c.totalPaid, c.completed);
    }

    /**
     * @notice Get milestone details.
     */
    function getMilestone(
        bytes32 _contractId,
        uint8 _milestoneIndex
    ) external view returns (string memory description, uint256 amount, uint256 paidAmount, bool fullyPaid) {
        require(contracts[_contractId].exists, "PaymentTracker: contract does not exist");
        require(_milestoneIndex < contracts[_contractId].milestoneCount, "PaymentTracker: invalid milestone index");

        Milestone storage m = milestones[_contractId][_milestoneIndex];
        return (m.description, m.amount, m.paidAmount, m.fullyPaid);
    }

    /**
     * @notice Get the number of milestones for a contract.
     */
    function getMilestoneCount(bytes32 _contractId) external view returns (uint8) {
        require(contracts[_contractId].exists, "PaymentTracker: contract does not exist");
        return contracts[_contractId].milestoneCount;
    }

    // ── Owner Management ────────────────────────────────

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "PaymentTracker: new owner is zero address");
        owner = _newOwner;
    }
}
