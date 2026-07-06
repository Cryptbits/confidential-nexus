# Confidential Nexus

The canonical dApp for the **[Wrappers Registry](https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry)** — browse every ERC-20 ↔ ERC-7984 wrapper pair on Sepolia and Ethereum Mainnet, wrap and unwrap tokens, decrypt confidential balances via EIP-712, and mint test tokens from the official Sepolia faucet.

---

## Features

**Page & What it does** 

**Registry**: Lists every official ERC-20 ↔ ERC-7984 pair on the connected network, sourced live from the onchain registry contract. Includes a Live Scanner (auto-runs on load, then keeps checking every few seconds) and the pair extension mechanism described below. 

**Faucet**: Mints all 7 official `cTokenMock` test tokens on Sepolia in one click. 

**Wrap**: Shields an ERC-20 into its ERC-7984 confidential equivalent, or unshields back, via the Zama relayer flow.

**Decrypt**: EIP-712 user decryption for any ERC-7984 balance, registry pairs or a custom address you paste in and plaintext never leaves the browser. 

**Snippets**: Copy-paste TypeScript, Solidity, and `cast` commands for integrating the registry into your own project. 

---

## Adding a New Wrapper Pair

This is the app's documented mechanism for adding ERC-20 ↔ ERC-7984 pairs that aren't yet in the local list, for example a pair you deployed yourself, or one registered onchain after this build was cut.

**Mechanism chosen: local config array.** This was chosen over an admin UI or fully dynamic onchain enumeration because it is the most auditable option for a registry product, every pair the app displays is reviewable in a single source controlled file (`lib/contracts.ts`), with no separate write access surface to secure. The app *also* reads live from the onchain registry contract (see the Registry page's "Live Scanner"), so this config exists purely as a fast, transparent way to extend coverage rather than as the primary source of truth.

### Steps

1. Open `lib/contracts.ts`.
2. Add an entry to the `CUSTOM_PAIRS` array:

```ts
export const CUSTOM_PAIRS: CustomPair[] = [
  {
    chainId:    11155111,                          // 1 = Mainnet, 11155111 = Sepolia
    symbol:     "MYTOKEN",
    name:       "My Custom Token",
    cSymbol:    "cMYTOKEN",
    underlying: "0xYourERC20Address...",
    wrapper:    "0xYourERC7984WrapperAddress...",
    decimals:   18,
    isMock:     false,
    isCustom:   true,
  },
];
```

3. Save. No other file needs to change, the pair automatically appears in the **Registry** table, the **Wrap** token selector, and the **Decrypt** balance list.

### Verifying a pair before adding it

Before adding a pair, confirm it is actually registered (and not revoked) by calling the registry contract directly:

```ts
const [isValid, confidentialToken] = await registry.getConfidentialTokenAddress(erc20TokenAddress);
```

- `isValid === false` means the pair was revoked, do not add it.
- The Registry page's **Live Scanner** does this automatically: it scans recent blocks the moment the page loads, then keeps checking every few seconds for anything new, so newly registered official pairs surface without needing a code change at all.

Registry contract addresses:
- Mainnet: [`0xeb5015fF021DB115aCe010f23F55C2591059bBA0`](https://etherscan.io/address/0xeb5015fF021DB115aCe010f23F55C2591059bBA0)
- Sepolia: [`0x2f0750Bbb0A246059d80e94c454586a7F27a128e`](https://sepolia.etherscan.io/address/0x2f0750Bbb0A246059d80e94c454586a7F27a128e)

---

## Architecture

```
app/
  page.tsx              Home: hero, live stats, feature navigation
  registry/page.tsx     Registry browser + live scanner + pair-extension docs
  faucet/page.tsx       Sepolia cTokenMock faucet
  wrap/page.tsx         Shield / unshield flow
  decrypt/page.tsx      EIP-712 balance decryption
  snippets/page.tsx     Copy-paste integration code
  providers.tsx         wagmi + RainbowKit + React Query setup
components/
  AppShell.tsx           Sidebar, topbar, responsive nav shell
  Logos.tsx              Inline SVG brand marks (Confidential Nexus)
lib/
  contracts.ts           Registry + pair addresses, ABIs, CUSTOM_PAIRS
  utils.ts               Formatting, explorer links, error messages
  fhe-stubs.ts           Fallback hooks used only if the Zama SDK isn't installed
```

## Notes on FHE operations

Shield, unshield, and decrypt use the Zama Protocol's live FHE gateway and relayer via the official public endpoints (`relayer.testnet.zama.org` for Sepolia) baked into the SDK's chain presets, the Registry and its Live Scanner also works on Sepolia and Mainnet, since they only read onchain state.

## Tech stack

Next.js 14 (App Router) · wagmi v2 · viem · RainbowKit · `@zama-fhe/react-sdk` v3.2 · `@zama-fhe/sdk` v3.2 · TypeScript

Requires **Node.js ≥ 22** (required by `@zama-fhe/sdk`).

### FHE integration note

`@zama-fhe/react-sdk`'s official wagmi adapter (`@zama-fhe/react-sdk/wagmi`) requires **wagmi v3** it calls wagmi's `useConnection` hook, introduced in v3. RainbowKit currently only supports wagmi v2 (`peerDependencies: { wagmi: "^2.9.0" }`), so the two can't be combined directly yet.

This app uses `@zama-fhe/sdk`'s **viem adapter** instead (`@zama-fhe/sdk/viem`). wagmi v2's `useWalletClient()` / `usePublicClient()` hooks already return real viem `WalletClient` / `PublicClient` instances internally, so this bridges cleanly with zero changes to the wallet connection UI, see `app/providers.tsx` → `ZamaBridge`. The relayer configuration uses the official public endpoints baked into the SDK's chain presets (`relayer.testnet.zama.org` for Sepolia, `relayer.mainnet.zama.org` for Mainnet), no backend proxy or API key required for standard usage.

If a future `@zama-fhe/react-sdk` release relaxes its wagmi version requirement (or RainbowKit adds wagmi v3 support), `ZamaBridge` in `providers.tsx` can be simplified to use the official `/wagmi` adapter directly.

## Built for

[Zama Developer Program | Mainnet Season 3 Bounty Track] 