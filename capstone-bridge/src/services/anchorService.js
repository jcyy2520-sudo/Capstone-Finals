const { ethers } = require("ethers");

/**
 * Build a Merkle tree from an array of leaf hashes (hex strings).
 * Returns { root, proofs } where proofs[i] is the proof for leaf i.
 */
function buildMerkleTree(leaves) {
  if (leaves.length === 0) return { root: ethers.ZeroHash, proofs: [] };
  if (leaves.length === 1) return { root: leaves[0], proofs: [[]] };

  // Ensure even number of leaves by duplicating the last one
  const padded = [...leaves];
  if (padded.length % 2 !== 0) padded.push(padded[padded.length - 1]);

  // Build tree layers bottom-up
  const layers = [padded];
  while (layers[layers.length - 1].length > 1) {
    const current = layers[layers.length - 1];
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = current[i + 1];
      const pair = left < right ? [left, right] : [right, left];
      next.push(ethers.keccak256(ethers.concat(pair)));
    }
    layers.push(next);
  }

  const root = layers[layers.length - 1][0];

  // Build proofs for each original leaf
  const proofs = leaves.map((_, leafIndex) => {
    const proof = [];
    let idx = leafIndex;
    // If leaf was beyond original array (padding), skip
    for (let layerIdx = 0; layerIdx < layers.length - 1; layerIdx++) {
      const layer = layers[layerIdx];
      const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
      if (siblingIdx < layer.length) {
        proof.push(layer[siblingIdx]);
      }
      idx = Math.floor(idx / 2);
    }
    return proof;
  });

  return { root, proofs };
}

/**
 * Verify a Merkle proof for a given leaf against a known root.
 */
function verifyMerkleProof(leaf, proof, root) {
  let hash = leaf;
  for (const sibling of proof) {
    const pair = hash < sibling ? [hash, sibling] : [sibling, hash];
    hash = ethers.keccak256(ethers.concat(pair));
  }
  return hash === root;
}

module.exports = { buildMerkleTree, verifyMerkleProof };
