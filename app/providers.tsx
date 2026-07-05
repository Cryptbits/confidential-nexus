"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { ReactNode, useMemo } from "react";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import {
  WagmiProvider, createConfig, http, fallback,
  useWalletClient, usePublicClient, useAccount,
} from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet, metaMaskWallet, coinbaseWallet,
  walletConnectWallet, rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { createConfig as createZamaConfig } from "@zama-fhe/sdk/viem";
import { web } from "@zama-fhe/sdk/web";
import { sepolia as sepoliaFhe, mainnet as mainnetFhe } from "@zama-fhe/sdk/chains";
import { createPublicClient, createWalletClient, http as viemHttp, type PublicClient, type WalletClient } from "viem";

const PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "b56e18d47c72ab683b10814fe9495694";

const connectors = connectorsForWallets(
  [{ groupName: "Wallets",
     wallets: [metaMaskWallet, coinbaseWallet, rainbowWallet, walletConnectWallet, injectedWallet] }],
  { appName: "Confidential Nexus", projectId: PROJECT_ID },
);

/* ── Sepolia-first: listed first so RainbowKit defaults to it ── */
export const wagmiConfig = createConfig({
  chains:     [sepolia, mainnet],
  connectors,
  ssr: true,
  transports: {
    [sepolia.id]: fallback([
      http("https://rpc2.sepolia.org",                    { timeout: 8000 }),
      http("https://ethereum-sepolia-rpc.publicnode.com",  { timeout: 8000 }),
      http("https://sepolia.gateway.tenderly.co",          { timeout: 8000 }),
      http("https://rpc.sepolia.ethpandaops.io",           { timeout: 8000 }),
    ], { retryCount: 1, retryDelay: 100 }),
    [mainnet.id]: fallback([
      http("https://eth.llamarpc.com",       { timeout: 8000 }),
      http("https://cloudflare-eth.com",     { timeout: 8000 }),
      http("https://rpc.ankr.com/eth",       { timeout: 8000 }),
      http("https://ethereum.publicnode.com",{ timeout: 8000 }),
    ], { retryCount: 1, retryDelay: 100 }),
  },
  batch: { multicall: { batchSize: 512, wait: 16 } },
});

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

/* ── Zama FHE bridge ──────────────────────────────────────────────
   @zama-fhe/react-sdk's official wagmi adapter (`/wagmi`) requires
   wagmi v3 (it calls wagmi's `useConnection`, introduced in v3).
   RainbowKit only supports wagmi v2 (`peerDependencies: wagmi ^2.9.0`)
   as of this writing, so the two can't be combined directly.

   Fix: use the SDK's viem adapter instead (`@zama-fhe/sdk/viem`).
   wagmi v2's `useWalletClient()` / `usePublicClient()` already return
   real viem `WalletClient` / `PublicClient` instances under the hood,
   so this bridges cleanly with zero changes to the wallet/connect UI.

   ZamaProvider always needs a `walletClient` in its config, and every
   hook throws if called with no ZamaProvider ancestor at all — so
   ZamaBridge always mounts one. Before a wallet connects (or during
   Next's server-side render pass), it uses a read-only placeholder
   walletClient with no account; real shield/unshield/decrypt actions
   are already gated behind `isConnected` in the UI, so the placeholder
   is never actually used to sign anything. Once a real wallet connects,
   the config swaps to the real walletClient automatically. ── */
function useZamaConfig() {
  const { isConnected } = useAccount();
  const { data: liveWalletClient } = useWalletClient();
  const livePublicClient = usePublicClient();

  return useMemo(() => {
    const chains = [sepoliaFhe, mainnetFhe] as const;
    const relayers = { [sepoliaFhe.id]: web(), [mainnetFhe.id]: web() };

    if (isConnected && liveWalletClient && livePublicClient) {
      try {
        return createZamaConfig({
          chains,
          publicClient: livePublicClient as PublicClient,
          walletClient: liveWalletClient as WalletClient,
          relayers,
        });
      } catch {
        /* fall through to placeholder */
      }
    }

    // Placeholder: read-only client, no signer. Keeps ZamaProvider
    // mounted at all times so hooks never throw for lack of context.
    try {
      const readOnlyClient = createPublicClient({
        chain:     sepolia,
        transport: viemHttp(sepoliaFhe.network as string),
      });
      const placeholderWallet = createWalletClient({
        chain:     sepolia,
        transport: viemHttp(sepoliaFhe.network as string),
      });
      return createZamaConfig({
        chains,
        publicClient: readOnlyClient as PublicClient,
        walletClient: placeholderWallet as WalletClient,
        relayers,
      });
    } catch {
      return null;
    }
  }, [isConnected, liveWalletClient, livePublicClient]);
}

function ZamaBridge({ children }: { children: ReactNode }) {
  const zamaConfig = useZamaConfig();
  if (!zamaConfig) return <>{children}</>;
  return <ZamaProvider config={zamaConfig}>{children}</ZamaProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor:           "#F5C430",
            accentColorForeground: "#000000",
            borderRadius:          "medium",
            fontStack:             "system",
            overlayBlur:           "small",
          })}
          modalSize="compact"
          initialChain={sepolia}
        >
          <ZamaBridge>{children}</ZamaBridge>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
