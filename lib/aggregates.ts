import type { UserSplit } from './useUserSplits';

export type SplitTotals = {
  /** Sum of unpaid shares you owe across splits where you're a non-creator participant. */
  youOwe: bigint;
  /** Number of splits in which you still owe money. */
  youOweCount: number;
  /** Sum of unpaid shares others still owe you across splits you created. */
  owedToYou: bigint;
  /** Number of splits where you have outstanding inflow. */
  owedToYouCount: number;
};

export function computeTotals(splits: readonly UserSplit[]): SplitTotals {
  let youOwe = 0n;
  let youOweCount = 0;
  let owedToYou = 0n;
  let owedToYouCount = 0;

  for (const s of splits) {
    // You owe: you're listed as a participant, you didn't create it,
    // and you haven't paid yet.
    if (s.role === 'participant' && !s.hasPaidByUser) {
      youOwe += s.amountPerPerson;
      youOweCount += 1;
    }
    // Owed to you: you created the split; some participants still haven't paid.
    if (s.role === 'creator' || s.role === 'both') {
      const unpaid = BigInt(s.participants.length) - s.paidCount;
      if (unpaid > 0n) {
        owedToYou += s.amountPerPerson * unpaid;
        owedToYouCount += 1;
      }
    }
  }

  return { youOwe, youOweCount, owedToYou, owedToYouCount };
}
