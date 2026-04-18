const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BidManager", function () {
  let bidManager, owner, bidder1, bidder2, bidder3;
  const procId = ethers.keccak256(ethers.toUtf8Bytes("PROC-2026-001"));
  const abc = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, bidder1, bidder2, bidder3] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BidManager");
    bidManager = await Factory.deploy();
    await bidManager.waitForDeployment();
  });

  function sealBid(amount, salt) {
    return ethers.keccak256(ethers.solidityPacked(["uint256", "bytes32"], [amount, salt]));
  }

  describe("Open Bidding", function () {
    it("should open a bidding session", async function () {
      const deadline = (await time.latest()) + 3600;
      await expect(bidManager.openBidding(procId, abc, deadline))
        .to.emit(bidManager, "BiddingOpened")
        .withArgs(procId, abc, deadline);

      expect(await bidManager.getSessionStatus(procId)).to.equal(1); // OPEN
    });

    it("should reject duplicate sessions", async function () {
      const deadline = (await time.latest()) + 3600;
      await bidManager.openBidding(procId, abc, deadline);
      await expect(bidManager.openBidding(procId, abc, deadline))
        .to.be.revertedWith("BidManager: session already exists");
    });

    it("should reject past deadlines", async function () {
      const pastDeadline = (await time.latest()) - 1;
      await expect(bidManager.openBidding(procId, abc, pastDeadline))
        .to.be.revertedWith("BidManager: deadline must be in the future");
    });

    it("should reject zero ABC", async function () {
      const deadline = (await time.latest()) + 3600;
      await expect(bidManager.openBidding(procId, 0, deadline))
        .to.be.revertedWith("BidManager: ABC must be > 0");
    });
  });

  describe("Sealed Bid Submission", function () {
    let deadline;
    const salt1 = ethers.keccak256(ethers.toUtf8Bytes("salt-bidder1"));
    const amount1 = ethers.parseEther("800000");

    beforeEach(async function () {
      deadline = (await time.latest()) + 3600;
      await bidManager.openBidding(procId, abc, deadline);
    });

    it("should accept a sealed bid", async function () {
      const commit = sealBid(amount1, salt1);
      await expect(bidManager.connect(bidder1).submitSealedBid(procId, commit))
        .to.emit(bidManager, "SealedBidSubmitted")
        .withArgs(procId, bidder1.address, commit);

      expect(await bidManager.getBidderCount(procId)).to.equal(1);
    });

    it("should reject duplicate bids from same bidder", async function () {
      const commit = sealBid(amount1, salt1);
      await bidManager.connect(bidder1).submitSealedBid(procId, commit);
      await expect(bidManager.connect(bidder1).submitSealedBid(procId, commit))
        .to.be.revertedWith("BidManager: already submitted a bid");
    });

    it("should reject bids after deadline", async function () {
      await time.increaseTo(deadline + 1);
      const commit = sealBid(amount1, salt1);
      await expect(bidManager.connect(bidder1).submitSealedBid(procId, commit))
        .to.be.revertedWith("BidManager: bidding deadline passed");
    });

    it("should accept multiple bidders", async function () {
      const salt2 = ethers.keccak256(ethers.toUtf8Bytes("salt-bidder2"));
      await bidManager.connect(bidder1).submitSealedBid(procId, sealBid(amount1, salt1));
      await bidManager.connect(bidder2).submitSealedBid(procId, sealBid(ethers.parseEther("900000"), salt2));

      expect(await bidManager.getBidderCount(procId)).to.equal(2);
      expect(await bidManager.getBidderAtIndex(procId, 0)).to.equal(bidder1.address);
      expect(await bidManager.getBidderAtIndex(procId, 1)).to.equal(bidder2.address);
    });
  });

  describe("Bid Closing and Reveal", function () {
    let deadline;
    const salt1 = ethers.keccak256(ethers.toUtf8Bytes("salt-1"));
    const salt2 = ethers.keccak256(ethers.toUtf8Bytes("salt-2"));
    const salt3 = ethers.keccak256(ethers.toUtf8Bytes("salt-3"));
    const amount1 = ethers.parseEther("800000");  // lowest
    const amount2 = ethers.parseEther("950000");
    const amount3 = ethers.parseEther("1100000");  // exceeds ABC

    beforeEach(async function () {
      deadline = (await time.latest()) + 3600;
      await bidManager.openBidding(procId, abc, deadline);

      await bidManager.connect(bidder1).submitSealedBid(procId, sealBid(amount1, salt1));
      await bidManager.connect(bidder2).submitSealedBid(procId, sealBid(amount2, salt2));
      await bidManager.connect(bidder3).submitSealedBid(procId, sealBid(amount3, salt3));

      await bidManager.closeBidding(procId);
    });

    it("should close bidding", async function () {
      expect(await bidManager.getSessionStatus(procId)).to.equal(2); // CLOSED
    });

    it("should reject bids after closing", async function () {
      const [, , , , lateBidder] = await ethers.getSigners();
      await expect(
        bidManager.connect(lateBidder).submitSealedBid(procId, sealBid(ethers.parseEther("500000"), salt1))
      ).to.be.revertedWith("BidManager: bidding is not open");
    });

    it("should reveal bids correctly", async function () {
      await expect(bidManager.revealBid(procId, bidder1.address, amount1, salt1))
        .to.emit(bidManager, "BidRevealed")
        .withArgs(procId, bidder1.address, amount1, true);

      await bidManager.revealBid(procId, bidder2.address, amount2, salt2);
      await bidManager.revealBid(procId, bidder3.address, amount3, salt3);

      // bidder3 is non-compliant (exceeds ABC)
      const bid3 = await bidManager.bids(procId, bidder3.address);
      expect(bid3.compliant).to.be.false;
    });

    it("should reject invalid commitment", async function () {
      const wrongSalt = ethers.keccak256(ethers.toUtf8Bytes("wrong"));
      await expect(bidManager.revealBid(procId, bidder1.address, amount1, wrongSalt))
        .to.be.revertedWith("BidManager: commitment verification failed");
    });

    it("should reject double reveal", async function () {
      await bidManager.revealBid(procId, bidder1.address, amount1, salt1);
      await expect(bidManager.revealBid(procId, bidder1.address, amount1, salt1))
        .to.be.revertedWith("BidManager: bid already revealed");
    });

    it("should determine lowest compliant bid", async function () {
      await bidManager.revealBid(procId, bidder1.address, amount1, salt1);
      await bidManager.revealBid(procId, bidder2.address, amount2, salt2);
      await bidManager.revealBid(procId, bidder3.address, amount3, salt3);
      await bidManager.finalizeReveals(procId);

      const [winner, winAmount] = await bidManager.getLowestCompliantBid(procId);
      expect(winner).to.equal(bidder1.address);
      expect(winAmount).to.equal(amount1);
    });
  });

  describe("Edge Cases", function () {
    it("should handle single bidder", async function () {
      const deadline = (await time.latest()) + 3600;
      const salt = ethers.keccak256(ethers.toUtf8Bytes("only-salt"));
      const amount = ethers.parseEther("500000");

      await bidManager.openBidding(procId, abc, deadline);
      await bidManager.connect(bidder1).submitSealedBid(procId, sealBid(amount, salt));
      await bidManager.closeBidding(procId);
      await bidManager.revealBid(procId, bidder1.address, amount, salt);
      await bidManager.finalizeReveals(procId);

      const [winner, winAmount] = await bidManager.getLowestCompliantBid(procId);
      expect(winner).to.equal(bidder1.address);
      expect(winAmount).to.equal(amount);
    });

    it("should handle all bids exceeding ABC", async function () {
      const deadline = (await time.latest()) + 3600;
      const salt = ethers.keccak256(ethers.toUtf8Bytes("over-salt"));
      const overAmount = ethers.parseEther("2000000");

      await bidManager.openBidding(procId, abc, deadline);
      await bidManager.connect(bidder1).submitSealedBid(procId, sealBid(overAmount, salt));
      await bidManager.closeBidding(procId);
      await bidManager.revealBid(procId, bidder1.address, overAmount, salt);
      await bidManager.finalizeReveals(procId);

      const [winner] = await bidManager.getLowestCompliantBid(procId);
      expect(winner).to.equal(ethers.ZeroAddress);
    });

    it("should handle zero bidders", async function () {
      const deadline = (await time.latest()) + 3600;
      await bidManager.openBidding(procId, abc, deadline);
      await bidManager.closeBidding(procId);
      await bidManager.finalizeReveals(procId);

      const [winner, amount] = await bidManager.getLowestCompliantBid(procId);
      expect(winner).to.equal(ethers.ZeroAddress);
      expect(amount).to.equal(0);
    });
  });

  describe("Ownership", function () {
    it("should transfer ownership", async function () {
      await bidManager.transferOwnership(bidder1.address);
      expect(await bidManager.owner()).to.equal(bidder1.address);
    });
  });
});
