/* ─────────────────────────────────────────────────────────────
   FHE Stub Hooks
   Used as a webpack alias fallback ONLY when @zama-fhe/react-sdk
   fails to resolve (e.g. not yet installed). All hooks return
   safe no-op values and surface a clear installation message.
   Hook names and signatures mirror the real SDK's public API
   exactly, so swapping the alias back to the real package is a
   drop-in replacement with zero code changes elsewhere.
   ───────────────────────────────────────────────────────────── */
import { ReactNode } from "react";

type Addr = `0x${string}`;
const MSG = "@zama-fhe/react-sdk is not installed. Run: npm install @zama-fhe/react-sdk @zama-fhe/sdk @tanstack/react-query";

export function ZamaProvider({ children }: { config?: unknown; children: ReactNode }) {
  return children;
}

export function useShield(
  _config: { address: Addr; optimistic?: boolean },
  cbs?: { onSuccess?: (r: { txHash?: Addr }) => void; onError?: (e: Error) => void }
) {
  return {
    mutate: () => setTimeout(() => cbs?.onError?.(new Error(MSG)), 0),
    isPending: false, isSuccess: false, isError: false, error: null, reset: () => {},
  };
}

export function useUnshield(
  _address: Addr,
  cbs?: { onSuccess?: (r: { txHash?: Addr }) => void; onError?: (e: Error) => void }
) {
  return {
    mutate: () => setTimeout(() => cbs?.onError?.(new Error(MSG)), 0),
    isPending: false, isSuccess: false, isError: false, error: null, reset: () => {},
  };
}

export function useGrantPermit() {
  return {
    mutate: (_addrs: Addr[], cbs?: { onSuccess?: () => void; onError?: (e: Error) => void }) =>
      setTimeout(() => cbs?.onError?.(new Error(MSG)), 0),
    isPending: false, error: null,
  };
}

export function useHasPermit(_config: { contractAddresses: Addr[] }) {
  return { data: false as boolean | undefined, refetch: () => {} };
}

export function useConfidentialBalance(_config: { address: Addr; account: Addr | undefined }, _opts?: { enabled?: boolean }) {
  return { data: undefined as bigint | undefined, isPending: false, error: null, refetch: () => {} };
}

export function useTokenPairsRegistry() {
  return { data: undefined as readonly unknown[] | undefined, isPending: false, error: null, refetch: () => {} };
}
