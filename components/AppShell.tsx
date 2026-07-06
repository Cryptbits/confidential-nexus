"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Home, LayoutGrid, ArrowLeftRight, KeyRound, Droplets, Code2, Menu, X } from "lucide-react";
import { CnWordmark } from "./Logos";

const NAV = [
  { href:"/",         label:"Home",     Icon:Home         },
  { href:"/registry", label:"Registry", Icon:LayoutGrid   },
  { href:"/faucet",   label:"Faucet",   Icon:Droplets,  badge:"Testnet" },
  { href:"/wrap",     label:"Wrap",     Icon:ArrowLeftRight},
  { href:"/decrypt",  label:"Decrypt",  Icon:KeyRound     },
  { href:"/snippets", label:"Snippets", Icon:Code2        },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const chainId   = useChainId();
  const isSepolia = chainId === 11155111;
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  const sidebar = (
    <>

      <div className="sb-brand">
       <CnWordmark />
       <span className="sb-powered">Powered by Confidential Nexus</span>
      </div>

      <nav className="sb-nav">
        
        <div className={`sb-net ${isSepolia ? "sb-net-sep" : "sb-net-main"}`}>
          <span className="net-dot" />
          {isSepolia ? "Sepolia Testnet" : "Ethereum Mainnet"}
        </div>

        
        <div className="sb-section">
          <span className="sb-section-label">Navigation</span>
          <div className="sb-section-line" />
        </div>

        {NAV.map(({ href, label, Icon, badge }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? "active" : ""}`}>
            <span className="nav-icon"><Icon size={15} /></span>
            {label}
            {badge && <span className="nav-badge">{badge}</span>}
          </Link>
        ))}
      </nav>

      <div className="sb-footer">© 2026 Confidential Nexus</div>
    </>
  );

  return (
    <div className="shell">
      
      <aside className="sidebar">{sidebar}</aside>

      
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <aside className={`sidebar sidebar-mobile ${open ? "open" : ""}`}>{sidebar}</aside>

      
      <div className="main-col">
        
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger btn" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
            
          </div>
          <div className="topbar-right">
            <div className={`net-pill ${isSepolia ? "net-sep" : "net-main"}`}>
              <span className="net-dot" />
              {isSepolia ? "Sepolia" : "Mainnet"}
            </div>
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
          </div>
        </header>

        <main className="page-wrap">
          {children}
        </main>
      </div>
    </div>
  );
}
