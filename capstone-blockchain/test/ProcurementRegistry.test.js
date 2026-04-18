const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProcurementRegistry", function () {
  let registry, owner, other;
  const procId = ethers.keccak256(ethers.toUtf8Bytes("PROC-2026-001"));
  const abc = ethers.parseEther("1000000"); // 1M units

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ProcurementRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  describe("Registration", function () {
    it("should register a procurement", async function () {
      const tx = await registry.registerProcurement(procId, "Road Construction Project", abc);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(registry, "ProcurementRegistered")
        .withArgs(procId, "Road Construction Project", abc, block.timestamp);

      const p = await registry.procurements(procId);
      expect(p.exists).to.be.true;
      expect(p.title).to.equal("Road Construction Project");
      expect(p.abc).to.equal(abc);
      expect(await registry.procurementCount()).to.equal(1);
    });

    it("should reject duplicate registration", async function () {
      await registry.registerProcurement(procId, "Project A", abc);
      await expect(registry.registerProcurement(procId, "Project B", abc))
        .to.be.revertedWith("ProcurementRegistry: procurement already registered");
    });

    it("should reject zero ABC", async function () {
      await expect(registry.registerProcurement(procId, "Project", 0))
        .to.be.revertedWith("ProcurementRegistry: ABC must be greater than zero");
    });

    it("should reject non-owner calls", async function () {
      await expect(registry.connect(other).registerProcurement(procId, "Project", abc))
        .to.be.revertedWith("ProcurementRegistry: caller is not the owner");
    });
  });

  describe("Event Anchoring", function () {
    const eventHash = ethers.keccak256(ethers.toUtf8Bytes("event-data-1"));

    beforeEach(async function () {
      await registry.registerProcurement(procId, "Road Project", abc);
    });

    it("should anchor an event", async function () {
      await expect(registry.anchorEvent(procId, eventHash, 3)) // NOA_ISSUED
        .to.emit(registry, "EventAnchored");

      expect(await registry.verifyEvent(procId, eventHash)).to.be.true;
      expect(await registry.eventCount()).to.equal(1);
      expect(await registry.getEventCount(procId)).to.equal(1);
    });

    it("should reject duplicate event anchoring", async function () {
      await registry.anchorEvent(procId, eventHash, 0);
      await expect(registry.anchorEvent(procId, eventHash, 0))
        .to.be.revertedWith("ProcurementRegistry: event already anchored");
    });

    it("should reject events for non-existent procurement", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("FAKE"));
      await expect(registry.anchorEvent(fakeId, eventHash, 0))
        .to.be.revertedWith("ProcurementRegistry: procurement does not exist");
    });

    it("should reject non-owner event anchoring", async function () {
      await expect(registry.connect(other).anchorEvent(procId, eventHash, 0))
        .to.be.revertedWith("ProcurementRegistry: caller is not the owner");
    });

    it("should return event details", async function () {
      await registry.anchorEvent(procId, eventHash, 4); // CONTRACT_SIGNED
      const detail = await registry.getEventDetail(procId, eventHash);
      expect(detail.eventType).to.equal(4);
      expect(detail.exists).to.be.true;
    });

    it("should track event history by index", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("evt-1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("evt-2"));
      await registry.anchorEvent(procId, hash1, 0);
      await registry.anchorEvent(procId, hash2, 1);

      expect(await registry.getEventHashAtIndex(procId, 0)).to.equal(hash1);
      expect(await registry.getEventHashAtIndex(procId, 1)).to.equal(hash2);
    });

    it("should return false for unanchored events", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      expect(await registry.verifyEvent(procId, fakeHash)).to.be.false;
    });
  });

  describe("Ownership", function () {
    it("should transfer ownership", async function () {
      await registry.transferOwnership(other.address);
      expect(await registry.owner()).to.equal(other.address);
    });

    it("should reject zero-address transfer", async function () {
      await expect(registry.transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWith("ProcurementRegistry: new owner is zero address");
    });
  });
});

async function getBlockTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}
