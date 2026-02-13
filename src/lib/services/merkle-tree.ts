import { keccak256, encodePacked, type Hex } from "viem";

// =============================================================================
// Merkle Tree for On-Chain Claim Verification
// =============================================================================

/**
 * A leaf in the Merkle tree: a wallet address and its allocation amount.
 */
export interface MerkleLeaf {
  address: Hex;
  amount: bigint;
}

/**
 * A built Merkle tree containing the root, leaves, layers, and lookup helpers.
 */
export interface MerkleTree {
  root: Hex;
  leaves: Hex[];
  layers: Hex[][];
  leafMap: Map<string, number>;
}

/**
 * Hash a single leaf node: keccak256(abi.encodePacked(address, amount)).
 *
 * The double-hash pattern (hash the concatenation, then hash the result)
 * prevents second pre-image attacks. This matches the OpenZeppelin
 * MerkleProof library convention.
 */
function hashLeaf(address: Hex, amount: bigint): Hex {
  const packed = keccak256(
    encodePacked(["address", "uint256"], [address, amount])
  );
  return keccak256(encodePacked(["bytes32"], [packed]));
}

/**
 * Hash two sibling nodes together. Nodes are sorted before hashing
 * to produce a canonical (order-independent) tree, matching the
 * OpenZeppelin convention.
 */
function hashPair(a: Hex, b: Hex): Hex {
  const sorted = a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
  return keccak256(
    encodePacked(["bytes32", "bytes32"], [sorted[0] as Hex, sorted[1] as Hex])
  );
}

/**
 * Generate a Merkle tree from an array of allocation leaves.
 *
 * @param allocations - Array of { address, amount } entries. Duplicates
 *   (same address) are not allowed and will throw.
 * @returns A MerkleTree with root, leaf hashes, all layers, and a lookup map.
 *
 * @example
 * ```ts
 * const tree = generateMerkleTree([
 *   { address: "0xabc...", amount: 1000n },
 *   { address: "0xdef...", amount: 2000n },
 * ]);
 * console.log(tree.root);
 * ```
 */
export function generateMerkleTree(allocations: MerkleLeaf[]): MerkleTree {
  if (allocations.length === 0) {
    return {
      root: "0x0000000000000000000000000000000000000000000000000000000000000000",
      leaves: [],
      layers: [[]],
      leafMap: new Map(),
    };
  }

  // Ensure no duplicate addresses
  const addressSet = new Set<string>();
  for (const alloc of allocations) {
    const lower = alloc.address.toLowerCase();
    if (addressSet.has(lower)) {
      throw new Error(`Duplicate address in Merkle tree: ${alloc.address}`);
    }
    addressSet.add(lower);
  }

  // Build leaf hashes and the address -> index lookup
  const leafMap = new Map<string, number>();
  const leaves: Hex[] = allocations.map((alloc, index) => {
    leafMap.set(alloc.address.toLowerCase(), index);
    return hashLeaf(alloc.address, alloc.amount);
  });

  // Build layers bottom-up
  const layers: Hex[][] = [leaves];
  let currentLayer = [...leaves];

  while (currentLayer.length > 1) {
    const nextLayer: Hex[] = [];

    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        nextLayer.push(hashPair(currentLayer[i], currentLayer[i + 1]));
      } else {
        // Odd element: promote to the next layer (self-pair)
        nextLayer.push(currentLayer[i]);
      }
    }

    layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  const root = currentLayer[0];

  return { root, leaves, layers, leafMap };
}

/**
 * Get the Merkle proof for a specific address.
 *
 * @param tree - The Merkle tree to query.
 * @param address - The wallet address to get the proof for.
 * @returns An array of sibling hashes forming the proof, or null if the
 *   address is not in the tree.
 */
export function getMerkleProof(tree: MerkleTree, address: Hex): Hex[] | null {
  const index = tree.leafMap.get(address.toLowerCase());
  if (index === undefined) {
    return null;
  }

  const proof: Hex[] = [];
  let currentIndex = index;

  for (let layerIndex = 0; layerIndex < tree.layers.length - 1; layerIndex++) {
    const layer = tree.layers[layerIndex];
    const isRight = currentIndex % 2 === 1;
    const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

    if (siblingIndex < layer.length) {
      proof.push(layer[siblingIndex]);
    }

    currentIndex = Math.floor(currentIndex / 2);
  }

  return proof;
}

/**
 * Get the root hash of a Merkle tree.
 *
 * @param tree - The Merkle tree.
 * @returns The root hash as a hex string.
 */
export function getMerkleRoot(tree: MerkleTree): Hex {
  return tree.root;
}

/**
 * Verify that a leaf is included in the Merkle tree.
 *
 * @param root - The expected root hash.
 * @param address - The wallet address.
 * @param amount - The allocation amount.
 * @param proof - The Merkle proof (sibling hashes).
 * @returns True if the proof is valid.
 */
export function verifyMerkleProof(
  root: Hex,
  address: Hex,
  amount: bigint,
  proof: Hex[]
): boolean {
  let hash = hashLeaf(address, amount);

  for (const sibling of proof) {
    hash = hashPair(hash, sibling);
  }

  return hash.toLowerCase() === root.toLowerCase();
}
