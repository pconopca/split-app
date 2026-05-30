'use client';

import { useMemo, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog, parseUnits } from 'viem';
import Link from 'next/link';
import { ConnectButton } from '@/components/ConnectButton';
import {
  SPLIT_REGISTRY_ABI,
  SPLIT_REGISTRY_ADDRESS,
  ACTIVE_CHAIN,
  MAX_MEMO_LENGTH,
} from '@/lib/contract';
import { ParticipantInput } from '@/components/ParticipantInput';
import { SaveFriendsPrompt } from '@/components/SaveFriendsPrompt';
import { ShareButton } from '@/components/ShareButton';
import { formatUSDC } from '@/lib/usdc';

type Row = { id: string; raw: string; resolved: `0x${string}` | null };

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

type Step = 1 | 2 | 3;

export default function NewSplitPage() {
  const { isConnected, chainId } = useAccount();
  const wrongChain = isConnected && chainId !== ACTIVE_CHAIN.id;

  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [memo, setMemo] = useState('');
  const [totalInput, setTotalInput] = useState('');
  const [peopleCount, setPeopleCount] = useState(2);
  const [includeMe, setIncludeMe] = useState(true);
  const memoBytes = new TextEncoder().encode(memo).length;
  const memoTooLong = memoBytes > MAX_MEMO_LENGTH;

  const totalUSDC = (() => {
    if (!totalInput) return null;
    try {
      const n = Number(totalInput);
      if (!Number.isFinite(n) || n <= 0) return null;
      return parseUnits(totalInput, 6);
    } catch {
      return null;
    }
  })();

  const perPersonUSDC =
    totalUSDC !== null && peopleCount > 0 ? totalUSDC / BigInt(peopleCount) : null;
  const remainder = totalUSDC !== null && perPersonUSDC !== null
    ? totalUSDC - perPersonUSDC * BigInt(peopleCount)
    : 0n;

  const friendsNeeded = includeMe ? peopleCount - 1 : peopleCount;

  // Step 2 state — initialized when entering step 2
  const [rows, setRows] = useState<Row[]>([]);

  function ensureRows(count: number) {
    setRows((prev) => {
      const next = [...prev];
      while (next.length < count) next.push({ id: uid(), raw: '', resolved: null });
      while (next.length > count) next.pop();
      return next;
    });
  }

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const resolvedAddresses = rows.map((r) => r.resolved).filter((a): a is `0x${string}` => !!a);
  const dedupedAddresses = Array.from(
    new Set(resolvedAddresses.map((a) => a.toLowerCase())),
  ) as `0x${string}`[];
  const allValid =
    rows.length === friendsNeeded &&
    dedupedAddresses.length === friendsNeeded &&
    resolvedAddresses.length === friendsNeeded;

  // Step 3 — contract write
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({ hash: txHash });

  const createdSplitId = useMemo(() => {
    if (!receipt) return null;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: SPLIT_REGISTRY_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'SplitCreated') return decoded.args.splitId;
      } catch {
        /* not our event */
      }
    }
    return null;
  }, [receipt]);

  function goToStep2() {
    ensureRows(friendsNeeded);
    setStep(2);
  }

  function handleSubmit() {
    if (perPersonUSDC === null || !allValid) return;
    reset();
    writeContract({
      address: SPLIT_REGISTRY_ADDRESS[ACTIVE_CHAIN.id],
      abi: SPLIT_REGISTRY_ABI,
      functionName: 'createSplit',
      args: [perPersonUSDC, dedupedAddresses, memo.trim()],
      chainId: ACTIVE_CHAIN.id,
    });
  }

  const canAdvanceFrom1 =
    totalUSDC !== null && peopleCount >= 2 && friendsNeeded >= 1 && !memoTooLong;

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-[#0a0e1a]">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          ← Home
        </Link>
        <ConnectButton />
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-6 py-6 flex flex-col gap-6">
        <StepIndicator current={step} />

        {wrongChain && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-200">
            Wallet is on chain {chainId}. Switch to <strong>{ACTIVE_CHAIN.name}</strong>.
          </div>
        )}

        {step === 1 && (
          <Step1
            memo={memo}
            setMemo={setMemo}
            memoBytes={memoBytes}
            memoTooLong={memoTooLong}
            totalInput={totalInput}
            setTotalInput={setTotalInput}
            peopleCount={peopleCount}
            setPeopleCount={setPeopleCount}
            includeMe={includeMe}
            setIncludeMe={setIncludeMe}
            perPersonUSDC={perPersonUSDC}
            remainder={remainder}
            canAdvance={canAdvanceFrom1}
            onNext={goToStep2}
            isConnected={isConnected}
          />
        )}

        {step === 2 && (
          <Step2
            rows={rows}
            updateRow={updateRow}
            friendsNeeded={friendsNeeded}
            includeMe={includeMe}
            allValid={allValid}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3
            memo={memo}
            totalUSDC={totalUSDC}
            perPersonUSDC={perPersonUSDC}
            peopleCount={peopleCount}
            includeMe={includeMe}
            participants={dedupedAddresses}
            isPending={isPending}
            isMining={isMining}
            error={error}
            createdSplitId={createdSplitId}
            txHash={txHash}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
          />
        )}
      </main>
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Amount' },
    { n: 2, label: 'Friends' },
    { n: 3, label: 'Confirm' },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1 gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              current >= s.n
                ? 'bg-[#0052ff] text-white'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
            }`}
          >
            {s.n}
          </div>
          <span
            className={`text-xs font-medium ${
              current === s.n
                ? 'text-zinc-900 dark:text-white'
                : 'text-zinc-500'
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-px ${
                current > s.n ? 'bg-[#0052ff]' : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

type Step1Props = {
  memo: string;
  setMemo: (v: string) => void;
  memoBytes: number;
  memoTooLong: boolean;
  totalInput: string;
  setTotalInput: (v: string) => void;
  peopleCount: number;
  setPeopleCount: (v: number) => void;
  includeMe: boolean;
  setIncludeMe: (v: boolean) => void;
  perPersonUSDC: bigint | null;
  remainder: bigint;
  canAdvance: boolean;
  onNext: () => void;
  isConnected: boolean;
};

function Step1({
  memo,
  setMemo,
  memoBytes,
  memoTooLong,
  totalInput,
  setTotalInput,
  peopleCount,
  setPeopleCount,
  includeMe,
  setIncludeMe,
  perPersonUSDC,
  remainder,
  canAdvance,
  onNext,
  isConnected,
}: Step1Props) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">What&apos;s it for?</h1>
        <p className="text-sm text-zinc-500 mt-1">We&apos;ll calculate each person&apos;s share.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="e.g. Dinner at Coco, birthday gift…"
          maxLength={MAX_MEMO_LENGTH * 2}
          className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 text-base text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${
            memoTooLong
              ? 'border-red-400 focus:ring-red-500'
              : 'border-zinc-200 dark:border-zinc-700 focus:ring-[#0052ff]'
          }`}
        />
        {memo.length > 0 && (
          <p
            className={`text-xs px-1 ${
              memoTooLong ? 'text-red-500' : 'text-zinc-500'
            }`}
          >
            {memoBytes} / {MAX_MEMO_LENGTH} bytes
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Total bill
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-zinc-400 font-light">$</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={totalInput}
            onChange={(e) => setTotalInput(e.target.value)}
            placeholder="80.00"
            className="w-full pl-10 pr-4 py-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-3xl font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0052ff] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Number of people
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPeopleCount(Math.max(2, peopleCount - 1))}
            className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xl font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            −
          </button>
          <div className="flex-1 text-center text-3xl font-bold text-zinc-900 dark:text-white py-2">
            {peopleCount}
          </div>
          <button
            type="button"
            onClick={() => setPeopleCount(Math.min(50, peopleCount + 1))}
            className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xl font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            +
          </button>
        </div>
      </div>

      <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            I&apos;m one of them
          </span>
          <span className="text-xs text-zinc-500 mt-0.5">
            {includeMe
              ? `You paid the bill — collect from ${Math.max(0, peopleCount - 1)} friends.`
              : `You’re organizing — collect from ${peopleCount} friends.`}
          </span>
        </div>
        <input
          type="checkbox"
          checked={includeMe}
          onChange={(e) => setIncludeMe(e.target.checked)}
          className="w-5 h-5 accent-[#0052ff]"
        />
      </label>

      {perPersonUSDC !== null && (
        <div className="rounded-xl bg-[#0052ff]/5 border border-[#0052ff]/20 p-4 flex flex-col items-center gap-1">
          <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Each pays</span>
          <span className="text-4xl font-bold text-[#0052ff]">
            ${formatUSDC(perPersonUSDC)}
          </span>
          {remainder > 0n && (
            <span className="text-xs text-amber-600 dark:text-amber-400 text-center">
              ${formatUSDC(remainder)} rounding goes to you
            </span>
          )}
        </div>
      )}

      {!isConnected && (
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      )}

      <button
        type="button"
        disabled={!canAdvance || !isConnected}
        onClick={onNext}
        className="w-full py-4 rounded-xl bg-[#0052ff] hover:bg-[#0040cc] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold transition-colors shadow-lg shadow-[#0052ff]/20 disabled:shadow-none"
      >
        Next
      </button>
    </>
  );
}

type Step2Props = {
  rows: Row[];
  updateRow: (id: string, patch: Partial<Row>) => void;
  friendsNeeded: number;
  includeMe: boolean;
  allValid: boolean;
  onBack: () => void;
  onNext: () => void;
};

function Step2({ rows, updateRow, friendsNeeded, includeMe, allValid, onBack, onNext }: Step2Props) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Add {friendsNeeded} {friendsNeeded === 1 ? 'friend' : 'friends'}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {includeMe
            ? 'You’ll collect from them.'
            : 'Each pays directly to you.'}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <div key={row.id} className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 font-medium px-1">
              Friend {i + 1}
            </span>
            <ParticipantInput
              value={row.raw}
              onChange={(raw) => updateRow(row.id, { raw })}
              onResolved={(resolved) => updateRow(row.id, { resolved })}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-auto">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!allValid}
          onClick={onNext}
          className="flex-1 py-4 rounded-xl bg-[#0052ff] hover:bg-[#0040cc] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold shadow-lg shadow-[#0052ff]/20 disabled:shadow-none"
        >
          Review
        </button>
      </div>
    </>
  );
}

type Step3Props = {
  memo: string;
  totalUSDC: bigint | null;
  perPersonUSDC: bigint | null;
  peopleCount: number;
  includeMe: boolean;
  participants: `0x${string}`[];
  isPending: boolean;
  isMining: boolean;
  error: Error | null;
  createdSplitId: bigint | null;
  txHash: `0x${string}` | undefined;
  onBack: () => void;
  onSubmit: () => void;
};

function Step3({
  memo,
  totalUSDC,
  perPersonUSDC,
  peopleCount,
  includeMe,
  participants,
  isPending,
  isMining,
  error,
  createdSplitId,
  txHash,
  onBack,
  onSubmit,
}: Step3Props) {
  if (createdSplitId !== null) {
    const splitUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/split/${createdSplitId.toString()}`
        : `/split/${createdSplitId.toString()}`;
    const shareText = perPersonUSDC
      ? `Your share: $${formatUSDC(perPersonUSDC)} USDC. Pay it on Base 👇`
      : 'Pay your share in USDC on Base 👇';
    return (
      <div className="flex flex-col gap-6 py-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#0052ff]/10 flex items-center justify-center text-3xl">
            ✅
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Split #{createdSplitId.toString()} created
            </h2>
            <p className="text-sm text-zinc-500 mt-1">Send it to your friends.</p>
          </div>
        </div>
        <ShareButton url={splitUrl} title={`Split #${createdSplitId.toString()}`} text={shareText} />
        <SaveFriendsPrompt addresses={participants} />
        <Link
          href={`/split/${createdSplitId.toString()}`}
          className="text-sm text-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline"
        >
          Open split
        </Link>
        {txHash && (
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline text-zinc-500 text-center"
          >
            View transaction
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Review</h1>
        <p className="text-sm text-zinc-500 mt-1">Confirm and create your split.</p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
        {memo.trim() && <Row label="For" value={memo.trim()} />}
        <Row label="Total bill" value={totalUSDC !== null ? `$${formatUSDC(totalUSDC)}` : '—'} />
        <Row label="People" value={`${peopleCount} ${includeMe ? '(you + ' + (peopleCount - 1) + ')' : ''}`} />
        <Row
          label="Each pays"
          value={perPersonUSDC !== null ? `$${formatUSDC(perPersonUSDC)}` : '—'}
          highlight
        />
        <div className="p-4 flex flex-col gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Friends</span>
          <ul className="flex flex-col gap-1">
            {participants.map((p) => (
              <li key={p} className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                {p.slice(0, 6)}…{p.slice(-4)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 break-words">{error.message.split('\n')[0]}</p>
      )}

      <div className="flex gap-3 mt-auto">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending || isMining}
          className="flex-1 py-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          disabled={isPending || isMining}
          onClick={onSubmit}
          className="flex-1 py-4 rounded-xl bg-[#0052ff] hover:bg-[#0040cc] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold shadow-lg shadow-[#0052ff]/20 disabled:shadow-none"
        >
          {isPending ? 'Confirm in wallet…' : isMining ? 'Creating…' : 'Create split'}
        </button>
      </div>
    </>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-4 flex items-center justify-between">
      <span className="text-sm text-zinc-500">{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight ? 'text-[#0052ff] text-base' : 'text-zinc-900 dark:text-white'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
