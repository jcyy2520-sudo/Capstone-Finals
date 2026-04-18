const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PaymentTracker", function () {
  let tracker, owner, vendor, other;
  const contractId = ethers.keccak256(ethers.toUtf8Bytes("CONTRACT-001"));
  const procId = ethers.keccak256(ethers.toUtf8Bytes("PROC-2026-001"));
  const totalAmount = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, vendor, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PaymentTracker");
    tracker = await Factory.deploy();
    await tracker.waitForDeployment();
  });

  describe("Contract Registration", function () {
    it("should register a contract", async function () {
      await expect(tracker.registerContract(contractId, procId, vendor.address, totalAmount))
        .to.emit(tracker, "ContractRegistered")
        .withArgs(contractId, procId, vendor.address, totalAmount);

      const c = await tracker.contracts(contractId);
      expect(c.exists).to.be.true;
      expect(c.vendor).to.equal(vendor.address);
      expect(c.totalAmount).to.equal(totalAmount);
      expect(c.totalPaid).to.equal(0);
      expect(c.completed).to.be.false;
      expect(await tracker.contractCount()).to.equal(1);
    });

    it("should reject duplicate registration", async function () {
      await tracker.registerContract(contractId, procId, vendor.address, totalAmount);
      await expect(tracker.registerContract(contractId, procId, vendor.address, totalAmount))
        .to.be.revertedWith("PaymentTracker: contract already registered");
    });

    it("should reject zero-address vendor", async function () {
      await expect(tracker.registerContract(contractId, procId, ethers.ZeroAddress, totalAmount))
        .to.be.revertedWith("PaymentTracker: vendor is zero address");
    });

    it("should reject zero amount", async function () {
      await expect(tracker.registerContract(contractId, procId, vendor.address, 0))
        .to.be.revertedWith("PaymentTracker: amount must be > 0");
    });

    it("should reject non-owner calls", async function () {
      await expect(tracker.connect(other).registerContract(contractId, procId, vendor.address, totalAmount))
        .to.be.revertedWith("PaymentTracker: caller is not the owner");
    });
  });

  describe("Milestones", function () {
    beforeEach(async function () {
      await tracker.registerContract(contractId, procId, vendor.address, totalAmount);
    });

    it("should add milestones", async function () {
      await expect(tracker.addMilestone(contractId, "Phase 1 - Foundation", ethers.parseEther("300000")))
        .to.emit(tracker, "MilestoneAdded")
        .withArgs(contractId, 0, "Phase 1 - Foundation", ethers.parseEther("300000"));

      await tracker.addMilestone(contractId, "Phase 2 - Superstructure", ethers.parseEther("400000"));
      await tracker.addMilestone(contractId, "Phase 3 - Finishing", ethers.parseEther("300000"));

      expect(await tracker.getMilestoneCount(contractId)).to.equal(3);

      const m0 = await tracker.getMilestone(contractId, 0);
      expect(m0.description).to.equal("Phase 1 - Foundation");
      expect(m0.amount).to.equal(ethers.parseEther("300000"));
      expect(m0.paidAmount).to.equal(0);
      expect(m0.fullyPaid).to.be.false;
    });

    it("should reject zero-amount milestones", async function () {
      await expect(tracker.addMilestone(contractId, "Bad milestone", 0))
        .to.be.revertedWith("PaymentTracker: milestone amount must be > 0");
    });

    it("should reject non-owner milestone creation", async function () {
      await expect(tracker.connect(other).addMilestone(contractId, "Unauthorized", ethers.parseEther("100")))
        .to.be.revertedWith("PaymentTracker: caller is not the owner");
    });
  });

  describe("Payments", function () {
    const m1Amount = ethers.parseEther("300000");
    const m2Amount = ethers.parseEther("400000");
    const m3Amount = ethers.parseEther("300000");

    beforeEach(async function () {
      await tracker.registerContract(contractId, procId, vendor.address, totalAmount);
      await tracker.addMilestone(contractId, "Phase 1", m1Amount);
      await tracker.addMilestone(contractId, "Phase 2", m2Amount);
      await tracker.addMilestone(contractId, "Phase 3", m3Amount);
    });

    it("should record a payment", async function () {
      await expect(tracker.recordPayment(contractId, 0, m1Amount))
        .to.emit(tracker, "PaymentRecorded")
        .withArgs(contractId, 0, m1Amount, m1Amount);

      const m = await tracker.getMilestone(contractId, 0);
      expect(m.paidAmount).to.equal(m1Amount);
      expect(m.fullyPaid).to.be.true;

      const status = await tracker.getContractStatus(contractId);
      expect(status.paid).to.equal(m1Amount);
      expect(status.completed).to.be.false;
    });

    it("should allow partial milestone payments", async function () {
      const partial = ethers.parseEther("150000");
      await tracker.recordPayment(contractId, 0, partial);

      const m = await tracker.getMilestone(contractId, 0);
      expect(m.paidAmount).to.equal(partial);
      expect(m.fullyPaid).to.be.false;

      // Pay the rest
      await tracker.recordPayment(contractId, 0, partial);
      const m2 = await tracker.getMilestone(contractId, 0);
      expect(m2.fullyPaid).to.be.true;
    });

    it("should reject overpayment on milestone", async function () {
      const overAmount = ethers.parseEther("400000"); // exceeds milestone 1
      await expect(tracker.recordPayment(contractId, 0, overAmount))
        .to.be.revertedWith("PaymentTracker: payment exceeds milestone amount");
    });

    it("should reject payment on fully paid milestone", async function () {
      await tracker.recordPayment(contractId, 0, m1Amount);
      await expect(tracker.recordPayment(contractId, 0, ethers.parseEther("1")))
        .to.be.revertedWith("PaymentTracker: milestone already fully paid");
    });

    it("should reject zero payment", async function () {
      await expect(tracker.recordPayment(contractId, 0, 0))
        .to.be.revertedWith("PaymentTracker: payment amount must be > 0");
    });

    it("should reject invalid milestone index", async function () {
      await expect(tracker.recordPayment(contractId, 5, ethers.parseEther("100")))
        .to.be.revertedWith("PaymentTracker: invalid milestone index");
    });

    it("should mark contract completed when fully paid", async function () {
      await tracker.recordPayment(contractId, 0, m1Amount);
      await tracker.recordPayment(contractId, 1, m2Amount);
      await expect(tracker.recordPayment(contractId, 2, m3Amount))
        .to.emit(tracker, "ContractCompleted")
        .withArgs(contractId, totalAmount);

      const status = await tracker.getContractStatus(contractId);
      expect(status.completed).to.be.true;
      expect(status.paid).to.equal(totalAmount);
    });

    it("should reject payments on completed contract", async function () {
      await tracker.recordPayment(contractId, 0, m1Amount);
      await tracker.recordPayment(contractId, 1, m2Amount);
      await tracker.recordPayment(contractId, 2, m3Amount);

      // Contract is now completed — try adding a milestone
      await expect(tracker.addMilestone(contractId, "Extra", ethers.parseEther("100")))
        .to.be.revertedWith("PaymentTracker: contract already completed");
    });

    it("should reject non-owner payments", async function () {
      await expect(tracker.connect(other).recordPayment(contractId, 0, m1Amount))
        .to.be.revertedWith("PaymentTracker: caller is not the owner");
    });

    it("should track total payments recorded", async function () {
      await tracker.recordPayment(contractId, 0, m1Amount);
      await tracker.recordPayment(contractId, 1, m2Amount);
      expect(await tracker.totalPaymentsRecorded()).to.equal(2);
    });
  });

  describe("Ownership", function () {
    it("should transfer ownership", async function () {
      await tracker.transferOwnership(vendor.address);
      expect(await tracker.owner()).to.equal(vendor.address);
    });

    it("should reject zero-address transfer", async function () {
      await expect(tracker.transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWith("PaymentTracker: new owner is zero address");
    });
  });
});
