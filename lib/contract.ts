import { base, baseSepolia } from 'wagmi/chains';

export const SPLIT_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'createSplit',
    inputs: [
      { name: 'amountPerPerson', type: 'uint256' },
      { name: 'participants', type: 'address[]' },
      { name: 'memo', type: 'string' },
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
      { name: 'memo', type: 'string' },
      { name: 'cancelled', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'cancelSplit',
    inputs: [{ name: 'splitId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
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
    name: 'isParticipant',
    inputs: [
      { name: 'splitId', type: 'uint256' },
      { name: 'addr', type: 'address' },
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
    type: 'function',
    name: 'MAX_MEMO_BYTES',
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
      { name: 'memo', type: 'string', indexed: false },
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
  {
    type: 'event',
    name: 'SplitSettled',
    inputs: [{ name: 'splitId', type: 'uint256', indexed: true }],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'SplitCancelled',
    inputs: [{ name: 'splitId', type: 'uint256', indexed: true }],
    anonymous: false,
  },
] as const;

export const SPLIT_REGISTRY_ADDRESS: Record<number, `0x${string}`> = {
  [baseSepolia.id]: '0xF39820b22C4EEbFeef68B30198a0e6FF2228f562',
  [base.id]: '0x3d95627C52D30CD0419bbB75909aD86e99486d9D',
};

export const SPLIT_REGISTRY_DEPLOY_BLOCK: Record<number, bigint> = {
  [baseSepolia.id]: 42201397n,
  [base.id]: 46701923n,
};

export const USDC_ADDRESS: Record<number, `0x${string}`> = {
  [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

export const ACTIVE_CHAIN = base;

export const MAX_MEMO_LENGTH = 200;
