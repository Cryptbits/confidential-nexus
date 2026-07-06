"use client";
import Link from "next/link";
import { useChainId } from "wagmi";
import { LayoutGrid, ArrowLeftRight, KeyRound, Droplets, Code2, ArrowRight } from "lucide-react";
import { getPairs, getRegistry } from "@/lib/contracts";
import { short } from "@/lib/utils";

const FEATS = [
  { href:"/registry", label:"Registry Browser",  Icon:LayoutGrid,    color:"#F5C430",
    desc:"Every official ERC-20 ↔ ERC-7984 pair on Sepolia and Mainnet, live onchain, sourced directly from the Zama Wrappers Registry." },
  { href:"/faucet",   label:"Sepolia Faucet",     Icon:Droplets,       color:"#F59E0B", badge:"Testnet",
    desc:"Mint all 7 official cTokenMock test tokens on Sepolia in one click, ready to wrap immediately." },
  { href:"/wrap",     label:"Wrap / Unwrap",      Icon:ArrowLeftRight, color:"#22C55E",
    desc:"Shield any ERC-20 into its confidential ERC-7984 counterpart or unshield back, live on Sepolia via the Zama relayer." },
  { href:"/decrypt",  label:"Decrypt Balances",   Icon:KeyRound,       color:"#3B82F6",
    desc:"EIP-712 user-decryption reveals your private ERC-7984 balance entirely in browser, your plaintext never leaves your device." },
  { href:"/snippets", label:"Dev Snippets",        Icon:Code2,          color:"#A855F7",
    desc:"Copy-paste TypeScript, Solidity and cast commands to integrate the Zama wrapper registry into your own project." },
];

export default function Home() {
  const chainId   = useChainId();
  const isSepolia = chainId === 11155111;
  const pairs     = getPairs(chainId);
  const registry  = getRegistry(chainId);

  return (
    <div className="home fade-up">
      <div className="hero-card">
        <div className="hero-glow-a" />
        <div className="hero-glow-b" />

        <div className="hero-eyebrow">Confidential Wrapper Registry</div>

        <h1
          className="hero-title"
          style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
        >
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span className="hero-gold">Confidential</span>
            <span className="hero-white">Nexus</span>
          </span>
        </h1>

        <p className="hero-sub">
          The canonical dApp {" "}
          <a href="https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry"
            target="_blank" rel="noreferrer"
            style={{ color:"var(--gold)", fontWeight:600, textDecoration:"none" }}>
            Wrappers Registry
          </a>
          {" "}browse, wrap, decrypt and monitor every{" "}
          <strong>ERC-20 ↔ ERC-7984</strong> pair, live on{" "}
          <strong>Sepolia testnet</strong> with Mainnet registry display.
        </p>

        <div className="hero-stats">
          <div className="hstat">
            <span className="hstat-val" style={{ color:"var(--gold)" }}>{pairs.length}</span>
            <span className="hstat-lbl">Registry Pairs</span>
          </div>
          <div className="hstat-div" />
          <div className="hstat">
            <span className="hstat-val"
              style={{ color:isSepolia?"#FCD34D":"#4ADE80", fontSize:15, paddingTop:3 }}>
              {isSepolia ? "Sepolia" : "Mainnet"}
            </span>
            <span className="hstat-lbl">Active Network</span>
          </div>
          <div className="hstat-div" />
          <div className="hstat">
            <span className="hstat-val" style={{ fontSize:12, color:"var(--text-3)", paddingTop:5 }}>
              {short(registry, 10)}
            </span>
            <span className="hstat-lbl">Registry</span>
          </div>
          <div className="hstat-div" />
          <div className="hstat">
            <span className="hstat-val" style={{ fontSize:14, color:"#A855F7", paddingTop:4 }}>
              ERC-7984
            </span>
            <span className="hstat-lbl">Standard</span>
          </div>
        </div>
      </div>

      <div>
        <div className="section-hd">
          <span className="section-hd-label">Features</span>
          <div className="section-hd-line" />
        </div>
        <div className="feat-grid">
          {FEATS.map(({ href, label, Icon, color, desc, badge }) => (
            <Link key={href} href={href} className="feat-card"
              style={{ "--accent-color": color } as React.CSSProperties}>
              <div className="feat-icon"
                style={{ background:`${color}12`, border:`1px solid ${color}22` }}>
                <Icon size={19} color={color} />
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span className="feat-title">{label}</span>
                {badge && <span className="badge badge-amber">{badge}</span>}
              </div>
              <p className="feat-desc">{desc}</p>
              <div className="feat-cta" style={{ color }}>
                Open <ArrowRight size={13} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}