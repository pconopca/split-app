import { BaseError, ContractFunctionRevertedError } from 'viem';

export type FriendlyError = {
  kind:
    | 'user-rejected'
    | 'insufficient-gas'
    | 'insufficient-balance'
    | 'allowance'
    | 'wrong-network'
    | 'contract-revert'
    | 'network'
    | 'unknown';
  title: string;
  message: string;
  action?: { label: string; href: string };
};

/**
 * Map a known Solidity custom-error name to a sentence the user can act on.
 * Names that aren't in here fall back to a generic 'transaction reverted'.
 */
function contractErrorToMessage(name: string): string {
  switch (name) {
    case 'NotParticipant':
      return "You're not in this split.";
    case 'AlreadyPaid':
      return 'You already paid your share.';
    case 'SplitIsCancelled':
      return 'This split was cancelled. No payment is owed.';
    case 'UnknownSplit':
      return 'This split does not exist.';
    case 'NotCreator':
      return 'Only the creator can do this.';
    case 'AlreadyCancelled':
      return 'This split was already cancelled.';
    case 'AlreadyHasPayments':
      return "Can't cancel — someone already paid.";
    case 'TransferFailed':
      return 'USDC transfer failed. Check your USDC balance and try again.';
    case 'InvalidAmount':
      return 'Amount must be greater than zero.';
    case 'NoParticipants':
      return 'Add at least one participant.';
    case 'InvalidParticipant':
      return 'One of the participants has an invalid address.';
    case 'DuplicateParticipant':
      return 'Two of the participants share the same address.';
    case 'MemoTooLong':
      return 'Description is too long (max 200 characters).';
    default:
      return name ? `The contract refused this: ${name}.` : 'The transaction would fail on chain.';
  }
}

/**
 * Convert a wagmi/viem error from a wallet, RPC, or chain into something
 * we can show the user. Returns null only when there is no error at all.
 * For user-rejected actions, kind is 'user-rejected' and the caller can
 * choose to silently hide the banner.
 */
export function interpretError(error: unknown): FriendlyError | null {
  if (!error) return null;

  // viem wraps everything in BaseError and exposes .walk() to find the cause.
  if (error instanceof BaseError) {
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const errorName = revert.data?.errorName ?? '';
      return {
        kind: 'contract-revert',
        title: 'Transaction would fail',
        message: contractErrorToMessage(errorName),
      };
    }
  }

  const raw =
    (error as { shortMessage?: string }).shortMessage ??
    (error as Error).message ??
    'Unknown error';
  const msg = raw.toLowerCase();

  // Wallet rejection: user explicitly clicked Cancel / Reject.
  // EIP-1193 code 4001 OR various phrasing depending on the wallet.
  if (
    (error as { code?: number }).code === 4001 ||
    msg.includes('user rejected') ||
    msg.includes('user denied') ||
    msg.includes('rejected the request') ||
    msg.includes('rejected by user')
  ) {
    return { kind: 'user-rejected', title: '', message: '' };
  }

  // Common gas / fund issues.
  if (msg.includes('insufficient funds for gas') || msg.includes('insufficient funds for intrinsic')) {
    return {
      kind: 'insufficient-gas',
      title: 'Not enough ETH for gas',
      message:
        'You need a small amount of ETH on Base to cover gas. Bridge or fund the wallet, then try again.',
      action: { label: 'Bridge ETH to Base', href: 'https://bridge.base.org/deposit' },
    };
  }

  // Network / RPC level.
  if (
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('econnreset')
  ) {
    return {
      kind: 'network',
      title: 'Network problem',
      message: "Couldn't reach Base just now. Check your connection and try again.",
    };
  }

  if (msg.includes('wrong network') || msg.includes('chain mismatch') || msg.includes('unsupported chain')) {
    return {
      kind: 'wrong-network',
      title: 'Wrong network',
      message: 'Switch your wallet to Base and try again.',
    };
  }

  return {
    kind: 'unknown',
    title: 'Something went wrong',
    message: raw.split('\n')[0],
  };
}
