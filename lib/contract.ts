import { base, baseSepolia } from 'wagmi/chains';

export const SPLIT_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'createSplit',
    inputs: [
      { name: 'amountPerPerson', type: 'uint256' },
      { name: 'participants', type: 'address[]' },
    ],
    outputs: [{ name: 'splitId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'pay',
    inputs: [{ name: 'splitId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getSplit',
    inputs: [{ name: 'splitId', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'amountPerPerson', type: 'uint256' },
      { name: 'participants', type: 'address[]' },
      { name: 'paidCount', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasPaid',
    inputs: [
      { name: 'splitId', type: 'uint256' },
      { name: 'payer', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextSplitId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'SplitCreated',
    inputs: [
      { name: 'splitId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'amountPerPerson', type: 'uint256', indexed: false },
      { name: 'participants', type: 'address[]', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'SplitPaid',
    inputs: [
      { name: 'splitId', type: 'uint256', indexed: true },
      { name: 'payer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
] as const;

export const SPLIT_REGISTRY_ADDRESS: Record<number, `0x${string}`> = {
  [baseSepolia.id]: '0xeaC7919e5be02dFc038b4232b06e8F19c0A5e0cd',
  // [base.id]: '0x...', // fill after mainnet deploy
};

export const USDC_ADDRESS: Record<number, `0x${string}`> = {
  [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

export const ACTIVE_CHAIN = baseSepolia;
