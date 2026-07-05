"use client";
import { useState } from "react";
import { useChainId } from "wagmi";
import { Code2, BookOpen, ExternalLink, Check, Copy } from "lucide-react";
import { getPairs, getRegistry } from "@/lib/contracts";
import { short } from "@/lib/utils";

type Lang = "typescript" | "solidity" | "cast";

export default function SnippetsPage() {
  const chainId   = useChainId();
  const isSepolia = chainId === 11155111;
  const pairs     = getPairs(chainId);
  const registry  = getRegistry(chainId);
  const [lang, setLang] = useState<Lang>("typescript");
  const [copied, setCopied] = useState<string|null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(key); setTimeout(()=>setCopied(null), 1800);
  };

  const network = isSepolia ? "sepolia" : "mainnet";
  const p0 = pairs[0];
  const p1 = pairs[1];

  const snippets: Record<Lang, { label: string; key: string; code: string }[]> = {
    typescript: [
      {
        label: "Read registry pair count",
        key:   "ts-count",
        code:
`import { createPublicClient, http } from "viem";
import { ${network === "sepolia" ? "sepolia" : "mainnet"} } from "viem/chains";

const client = createPublicClient({
  chain: ${network === "sepolia" ? "sepolia" : "mainnet"},
  transport: http(),
});

const REGISTRY = "${registry}";

const REGISTRY_ABI = [
  {
    name: "getTokenPairsCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

const count = await client.readContract({
  address: REGISTRY,
  abi: REGISTRY_ABI,
  functionName: "getTokenPairsCount",
});
console.log("Total pairs:", count.toString());`,
      },
      {
        label: "Get a specific pair by index",
        key:   "ts-pair",
        code:
`const REGISTRY_ABI = [
  {
    name: "getTokenPairAt",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [
      { name: "tokenAddress",             type: "address" },
      { name: "confidentialTokenAddress", type: "address" },
    ],
  },
] as const;

const [underlying, wrapper] = await client.readContract({
  address: "${registry}",
  abi: REGISTRY_ABI,
  functionName: "getTokenPairAt",
  args: [0n],
});
// ${network} pair 0: ${p0 ? `${p0.symbol} → ${p0.cSymbol}` : "…"}
// underlying: ${p0?.underlying ?? "…"}
// wrapper:    ${p0?.wrapper   ?? "…"}`,
      },
      {
        label: "Listen for new registry registrations",
        key:   "ts-events",
        code:
`const unwatch = client.watchContractEvent({
  address: "${registry}",
  abi: [{
    type: "event",
    name: "ConfidentialTokenRegistered",
    inputs: [
      { name: "tokenAddress",             type: "address", indexed: true  },
      { name: "confidentialTokenAddress", type: "address", indexed: false },
    ],
  }],
  eventName: "ConfidentialTokenRegistered",
  onLogs(logs) {
    for (const log of logs) {
      console.log("New pair:", log.args);
    }
  },
});

// Stop watching
// unwatch();`,
      },
      {
        label: "Shield ERC-20 → ERC-7984 (Zama SDK)",
        key:   "ts-shield",
        code:
`import { useShield } from "@zama-fhe/react-sdk";
import { parseUnits } from "viem";

// Inside a React component:
const shield = useShield(
  {
    tokenAddress:   "${p0?.wrapper   ?? "0x…"}",  // ${p0?.cSymbol ?? "cToken"}
    wrapperAddress: "${p0?.wrapper   ?? "0x…"}",
    optimistic: true,
  },
  {
    onSuccess: ({ txHash }) => console.log("Shielded! tx:", txHash),
    onError:   (e)         => console.error("Shield failed:", e.message),
  },
);

// Trigger:
shield.mutate({ amount: parseUnits("100", ${p0?.decimals ?? 18}) });`,
      },
      {
        label: "EIP-712 decrypt balance (Zama SDK)",
        key:   "ts-decrypt",
        code:
`import { useAllow, useConfidentialBalance } from "@zama-fhe/react-sdk";

// Inside a React component:
const { mutate: allow }  = useAllow();
const { data: balance }  = useConfidentialBalance({
  tokenAddress: "${p1?.wrapper ?? p0?.wrapper ?? "0x…"}",
});

// Step 1 — authorize (once per 24h):
allow(["${p1?.wrapper ?? p0?.wrapper ?? "0x…"}"], {
  onSuccess: () => console.log("Session granted"),
});

// Step 2 — balance is now auto-decrypted in \`balance\`:
// balance => BigInt  (e.g. 100_000_000n for 100 USDT at 6 decimals)`,
      },
    ],
    solidity: [
      {
        label: "IWrappersRegistry interface",
        key:   "sol-registry",
        code:
`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IWrappersRegistry {
    /// @notice Total number of registered pairs
    function getTokenPairsCount() external view returns (uint256);

    /// @notice Pair at a given index
    function getTokenPairAt(uint256 index)
        external view
        returns (address tokenAddress, address confidentialTokenAddress);

    /// @notice Emitted when a new pair is registered
    event ConfidentialTokenRegistered(
        address indexed tokenAddress,
        address         confidentialTokenAddress
    );
}

// Registry on ${network}: ${registry}`,
      },
      {
        label: "Read pairs from registry on-chain",
        key:   "sol-read",
        code:
`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IWrappersRegistry } from "./IWrappersRegistry.sol";

contract PairReader {
    IWrappersRegistry public constant REGISTRY =
        IWrappersRegistry(${registry});

    struct Pair {
        address underlying;
        address wrapper;
    }

    function getAllPairs() external view returns (Pair[] memory pairs) {
        uint256 n = REGISTRY.getTokenPairsCount();
        pairs = new Pair[](n);
        for (uint256 i; i < n; ++i) {
            (address u, address w) = REGISTRY.getTokenPairAt(i);
            pairs[i] = Pair(u, w);
        }
    }
}`,
      },
    ],
    cast: [
      {
        label: "Get total pair count",
        key:   "cast-count",
        code:
`# Requires Foundry: https://getfoundry.sh
cast call \\
  ${registry} \\
  "getTokenPairsCount()(uint256)" \\
  --rpc-url ${isSepolia
    ? "https://rpc2.sepolia.org"
    : "https://eth.llamarpc.com"}`,
      },
      {
        label: "Get pair at index 0",
        key:   "cast-pair",
        code:
`cast call \\
  ${registry} \\
  "getTokenPairAt(uint256)(address,address)" \\
  0 \\
  --rpc-url ${isSepolia
    ? "https://rpc2.sepolia.org"
    : "https://eth.llamarpc.com"}

# Returns:
# ${p0?.underlying ?? "0x…"}   (${p0?.symbol ?? "ERC-20"})
# ${p0?.wrapper   ?? "0x…"}   (${p0?.cSymbol ?? "ERC-7984"})`,
      },
      {
        label: "Mint cTokenMock on Sepolia",
        key:   "cast-mint",
        code:
`# Only works on Sepolia — mocks have public mint()
# Replace $YOUR_WALLET and $PRIVATE_KEY

cast send \\
  ${isSepolia ? (p0?.underlying ?? "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF") : "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF"} \\
  "mint(address,uint256)" \\
  $YOUR_WALLET \\
  1000000000 \\
  --rpc-url https://rpc2.sepolia.org \\
  --private-key $PRIVATE_KEY

# Mints 1,000 ${p0?.symbol ?? "USDC"} (6 decimals) to your wallet`,
      },
      {
        label: "Watch ConfidentialTokenRegistered events",
        key:   "cast-watch",
        code:
`# Watch for new pairs being registered in real-time
cast logs \\
  --address ${registry} \\
  --topic0 $(cast keccak "ConfidentialTokenRegistered(address,address)") \\
  --rpc-url ${isSepolia
    ? "https://rpc2.sepolia.org"
    : "https://eth.llamarpc.com"} \\
  --follow`,
      },
    ],
  };

  const active = snippets[lang];

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:22 }}>

      {/* Page header */}
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-hd-icon"
            style={{ background:"rgba(168,85,247,0.09)", border:"1px solid rgba(168,85,247,0.18)" }}>
            <Code2 size={22} color="var(--purple)" />
          </div>
          <div>
            <h1 className="hd-xl">Developer Snippets</h1>
            <p className="sub">
              Showing <strong style={{ color:"var(--text)" }}>
                {isSepolia ? "Sepolia" : "Mainnet"}
              </strong> addresses switch network for the other set
            </p>
          </div>
        </div>
        <div className="page-hd-right">
          <a href="https://docs.zama.org/protocol/sdk" target="_blank" rel="noreferrer"
            className="btn btn-secondary btn-sm">
            <BookOpen size={12}/> SDK Docs
          </a>
          <a href="https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry"
            target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={12}/> Registry Docs
          </a>
        </div>
      </div>

      {/* Info */}
      <div className="info-box">
        <Code2 size={13} color="var(--gold)" style={{ flexShrink:0 }} />
        <span style={{ fontSize:13 }}>
          All addresses auto-update based on your connected network.
          Registry: <code style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--gold)" }}>
            {short(registry, 12)}
          </code>
        </span>
      </div>

      {/* Language tabs */}
      <div>
        <div className="section-hd">
          <span className="section-hd-label">Integration Code</span>
          <div className="section-hd-line" />
        </div>
        <div style={{ marginBottom:14 }}>
          <div className="tabs">
            {(["typescript","solidity","cast"] as Lang[]).map(l => (
              <button key={l} className={`tab-btn ${lang===l?"tab-active":""}`}
                onClick={()=>setLang(l)}>
                {l === "typescript" ? "TypeScript" : l === "solidity" ? "Solidity" : "Cast (Foundry)"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {active.map(s => (
            <div key={s.key} className="card">
              <div className="card-head">
                <span className="card-head-title">{s.label}</span>
                <button className="btn btn-secondary btn-sm"
                  onClick={()=>handleCopy(s.key, s.code)}>
                  {copied===s.key
                    ? <><Check size={12}/> Copied</>
                    : <><Copy size={12}/> Copy</>}
                </button>
              </div>
              <pre className="code-block" style={{ borderRadius:0, borderLeft:"none", borderRight:"none", borderBottom:"none", margin:0 }}>
                <code>{s.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Address reference */}
      <div>
        <div className="section-hd">
          <span className="section-hd-label">
            Address Reference {isSepolia ? "Sepolia" : "Mainnet"}
          </span>
          <div className="section-hd-line" />
        </div>
        <div className="card">
          <div style={{ overflowX:"auto" }}>
            <table className="reg-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>ERC-20 Underlying</th>
                  <th>ERC-7984 Wrapper</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} style={{ padding:"8px 16px", background:"rgba(245,196,48,0.04)" }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                      letterSpacing:"0.07em", color:"var(--text-4)", fontFamily:"var(--font-mono)" }}>
                      Registry: {registry}
                    </div>
                  </td>
                </tr>
                {pairs.map(p => (
                  <tr key={p.wrapper}>
                    <td>
                      <div style={{ fontWeight:700, fontSize:13.5 }}>{p.cSymbol}</div>
                      <div style={{ fontSize:11, color:"var(--text-4)" }}>{p.name}</div>
                    </td>
                    <td className="addr" style={{ fontSize:11 }}>{p.underlying}</td>
                    <td className="addr" style={{ fontSize:11 }}>{p.wrapper}</td>
                    <td>
                      <span className={`badge ${p.isMock?"badge-amber":"badge-blue"}`}>
                        {p.isMock?"Mock":"Official"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
