"use client";

import { useState } from "react";
import { useChainId, useAccount, useReadContract } from "wagmi";
import {
  KeyRound, Eye, EyeOff, Unlock, Lock, ExternalLink,
  AlertTriangle, Plus, X, RefreshCw, CheckCircle2, Info, WifiOff,
} from "lucide-react";
import { useGrantPermit, useHasPermit, useConfidentialBalance } from "@zama-fhe/react-sdk";
import { getPairs, ERC20_ABI } from "@/lib/contracts";
import { short, EXPLORER, formatUnits, friendlyErr } from "@/lib/utils";


function BalRow({
  wrapper, cSymbol, symbol, decimals, chainId, session, onRemove,
}: {
  wrapper:   `0x${string}`;
  cSymbol:   string;
  symbol:    string;
  decimals:  number;
  chainId:   number;
  session:   boolean;
  onRemove?: () => void;
}) {
  const [show, setShow] = useState(false);
  const { address: account } = useAccount();
  const { data: raw, isPending, error, refetch } =
    useConfidentialBalance({ address: wrapper, account }, { enabled: session });

  const display = (() => {
    if (!session)  return "— authorize first —";
    if (isPending) return "decrypting…";
    if (error)     return "decrypt failed";
    if (raw !== undefined) return show
      ? `${formatUnits(raw as bigint, decimals)} ${symbol}`
      : "••••••";
    return "—";
  })();

  const hasVal = session && raw !== undefined && !isPending && !error;

  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"13px 20px", borderBottom:"1px solid var(--border)", gap:12, flexWrap:"wrap",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, minWidth:0, flex:1 }}>
        <div style={{
          width:36, height:36, borderRadius:10, flexShrink:0,
          background:"rgba(245,196,48,0.08)", border:"1px solid rgba(245,196,48,0.16)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:10, fontWeight:800, color:"var(--gold)", fontFamily:"var(--font-hd)",
        }}>
          {cSymbol.replace("Mock","").slice(0,2)}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:700, color:"var(--gold)" }}>{cSymbol}</div>
          <div style={{ fontSize:11, color:"var(--text-4)", marginTop:2 }}>{symbol}</div>
          <a href={EXPLORER(chainId, wrapper)} target="_blank" rel="noreferrer"
            className="addr" style={{ fontSize:10.5, marginTop:2, display:"flex", alignItems:"center", gap:3 }}>
            {short(wrapper,8)} <ExternalLink size={8}/>
          </a>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
        <span style={{
          fontFamily:"var(--font-mono)", fontSize:13,
          color: !hasVal ? "var(--text-4)" : "var(--text)",
          minWidth:100, textAlign:"right",
        }}>
          {display}
        </span>
        {hasVal && (
          <>
            <button className="btn btn-secondary btn-icon btn-sm"
              onClick={()=>setShow(v=>!v)} title={show?"Hide":"Reveal"}>
              {show ? <EyeOff size={13}/> : <Eye size={13}/>}
            </button>
            <button className="btn btn-secondary btn-icon btn-sm"
              onClick={()=>refetch()} title="Refresh">
              <RefreshCw size={12}/>
            </button>
          </>
        )}
        {onRemove && (
          <button className="btn btn-secondary btn-icon btn-sm" onClick={onRemove}>
            <X size={12}/>
          </button>
        )}
      </div>
    </div>
  );
}


export default function DecryptPage() {
  const chainId   = useChainId();
  const isSepolia = chainId === 11155111;
  const { isConnected } = useAccount();
  const pairs = getPairs(chainId);

  const [custom,    setCustom]    = useState<`0x${string}`[]>([]);
  const [inputAddr, setInputAddr] = useState("");
  const [inputErr,  setInputErr]  = useState("");
  const [allowErr,  setAllowErr]  = useState("");

  const allAddrs = [
    ...pairs.map(p => p.wrapper),
    ...custom,
  ] as [`0x${string}`, ...`0x${string}`[]];

  const { mutate: allow, isPending: allowing } = useGrantPermit();
  const { data: session, refetch: recheck }    = useHasPermit({ contractAddresses: allAddrs });

  const sdkMissing = allowErr.includes("not installed");

  const { data: customSym } = useReadContract({
    address:      inputAddr.length===42 ? inputAddr as `0x${string}` : undefined,
    abi:          ERC20_ABI,
    functionName: "symbol",
    query:        { enabled: inputAddr.length===42 && inputAddr.startsWith("0x") },
  });

  const handleAuthorize = () => {
    setAllowErr("");
    allow(allAddrs, {
      onSuccess: () => recheck(),
      onError:   (e: Error) => setAllowErr(friendlyErr(e?.message)),
    });
  };

  const handleAddCustom = () => {
    const addr = inputAddr.trim();
    if (!addr.startsWith("0x") || addr.length !== 42) {
      setInputErr("Must be a valid 0x address"); return;
    }
    const hex = addr as `0x${string}`;
    if (custom.includes(hex) || pairs.map(p=>p.wrapper).includes(hex)) {
      setInputErr("Address already in list"); return;
    }
    setCustom(prev => [...prev, hex]);
    setInputAddr(""); setInputErr("");
  };

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:22 }}>

      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-hd-icon"
            style={{ background:"rgba(59,130,246,0.09)", border:"1px solid rgba(59,130,246,0.18)" }}>
            <KeyRound size={22} color="var(--blue)" />
          </div>
          <div>
            <h1 className="hd-xl">Balance Decryptor</h1>
            <p className="sub">EIP-712 user decryption, plaintext stays in your browser</p>
          </div>
        </div>
        <span className="badge badge-blue" style={{ fontSize:12, padding:"6px 14px" }}>EIP-712</span>
      </div>

      {!isSepolia && (
        <div className="alert alert-amber">
          <WifiOff size={15} style={{ flexShrink:0, marginTop:1 }} />
          <div>
            <strong style={{ display:"block", marginBottom:3 }}>Switch to Sepolia to decrypt</strong>
            <span style={{ fontSize:12.5 }}>
              FHE decryption uses the Zama gateway which is live on Sepolia testnet.
            </span>
          </div>
        </div>
      )}

      {sdkMissing && (
        <div className="alert alert-amber">
          <AlertTriangle size={15} style={{ flexShrink:0, marginTop:1 }} />
          <div>
            <strong style={{ display:"block", marginBottom:3 }}>Zama SDK not installed</strong>
            <code style={{ fontFamily:"var(--font-mono)", fontSize:12 }}>
              npm install @zama-fhe/react-sdk
            </code>
            <div style={{ fontSize:12, marginTop:4 }}>
              Run the above in your project directory, then restart the dev server.
            </div>
          </div>
        </div>
      )}

      
      <div className="card">
        <div className="card-head">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Lock size={14} color="var(--blue)" />
            <span className="card-head-title">How EIP-712 Decryption Works</span>
          </div>
        </div>
        <div style={{ padding:"22px 26px" }}>
          <div className="eip-steps">
            {[
              { n:"01", t:"Sign a Permit",
                d:"EIP-712 signature grants a 24-hour decryption session, stored locally in IndexedDB." },
              { n:"02", t:"Relayer Re-encrypts",
                d:"The Zama relayer re-encrypts your onchain ciphertext with your session's public key." },
              { n:"03", t:"Local Decrypt",
                d:"The SDK decrypts via WASM entirely in browser and plaintext never leaves your device." },
            ].map(s => (
              <div key={s.n} className="eip-step">
                <div className="eip-step-num">{s.n}</div>
                <div>
                  <div className="eip-step-title">{s.t}</div>
                  <div className="eip-step-desc">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="card">
          <div className="empty">
            <KeyRound size={32} style={{ color:"var(--text-4)" }} />
            <div className="empty-title">Wallet not connected</div>
            <div className="empty-desc">
              Connect your wallet on Sepolia to authorize and decrypt ERC-7984 balances.
            </div>
          </div>
        </div>
      ) : (
        <>
          {session ? (
            <div className="alert alert-green">
              <CheckCircle2 size={14} style={{ flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <strong>Session active</strong> click the{" "}
                <Eye size={11} style={{ display:"inline", verticalAlign:"middle" }}/> icon to reveal any balance.
                <div style={{ fontSize:11, color:"rgba(74,222,128,0.6)", marginTop:3 }}>
                  24h TTL · IndexedDB only · plaintext stays in browser · Sepolia
                </div>
              </div>
              <button className="btn btn-sm"
                style={{ background:"rgba(34,197,94,0.12)", color:"#4ADE80",
                  border:"1px solid rgba(34,197,94,0.22)", flexShrink:0 }}
                onClick={handleAuthorize} disabled={allowing}>
                <RefreshCw size={11}/> Renew
              </button>
            </div>
          ) : (
            <div className="card">
              <div className="card-body"
                style={{ alignItems:"center", textAlign:"center", padding:"40px 28px", gap:20 }}>
                <div style={{
                  width:64, height:64, borderRadius:18,
                  background:"rgba(59,130,246,0.09)", border:"1px solid rgba(59,130,246,0.18)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <Lock size={28} color="var(--blue)"/>
                </div>
                <div>
                  <div className="hd-lg" style={{ marginBottom:10 }}>
                    Authorize Balance Decryption
                  </div>
                  <div style={{ fontSize:13.5, color:"var(--text-2)", lineHeight:1.75, maxWidth:400 }}>
                    Sign one EIP-712 permit to decrypt your confidential balances across all{" "}
                    <strong style={{ color:"var(--text)" }}>{allAddrs.length}</strong> ERC-7984 tokens.
                    Valid for 24 hours, stored locally only.
                  </div>
                </div>

                {allowErr && !sdkMissing && (
                  <div className="alert alert-red" style={{ textAlign:"left", width:"100%" }}>
                    <AlertTriangle size={13} style={{ flexShrink:0 }}/>
                    <span style={{ fontSize:12.5 }}>{allowErr}</span>
                  </div>
                )}

                <button className="btn btn-primary"
                  style={{ padding:"13px 36px", fontSize:14.5 }}
                  onClick={handleAuthorize}
                  disabled={allowing || !isSepolia}>
                  {allowing
                    ? <><div className="spin spin-sm"/> Signing EIP-712…</>
                    : <><Unlock size={15}/> Authorize Decryption</>}
                </button>
                <div style={{ fontSize:11.5, color:"var(--text-4)" }}>
                  One signature · 24h TTL · IndexedDB only · Sepolia testnet
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="section-hd">
              <span className="section-hd-label">
                Registry Tokens — {isSepolia ? "Sepolia" : "Mainnet"}
              </span>
              <div className="section-hd-line"/>
              <span className="badge badge-gold">{pairs.length} pairs</span>
            </div>
            <div className="card">
              <div style={{ paddingTop:4 }}>
                {pairs.map(p => (
                  <BalRow key={p.wrapper} wrapper={p.wrapper} cSymbol={p.cSymbol}
                    symbol={p.symbol} decimals={p.decimals}
                    chainId={chainId} session={!!session} />
                ))}
              </div>
              {session && (
                <div style={{ padding:"12px 20px", borderTop:"1px solid var(--border)" }}>
                  <div className="info-box">
                    <Info size={12} color="var(--gold)" style={{ flexShrink:0 }}/>
                    <span style={{ fontSize:12 }}>
                      Click <Eye size={10} style={{ display:"inline", verticalAlign:"middle" }}/> on any
                      row to reveal that token's decrypted balance, stays local and never sent to a server.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="section-hd">
              <span className="section-hd-label">Decrypt Any ERC-7984</span>
              <div className="section-hd-line"/>
            </div>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-head-title">Custom Wrapper Address</div>
                  <div style={{ fontSize:12, color:"var(--text-3)", marginTop:2 }}>
                    Works with any ERC-7984 contract, not just registry pairs
                  </div>
                </div>
              </div>
              <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", gap:8 }}>
                  <input className="input"
                    style={{ fontFamily:"var(--font-mono)", fontSize:13 }}
                    placeholder="0x… any ERC-7984 wrapper address"
                    value={inputAddr}
                    onChange={e=>{ setInputAddr(e.target.value); setInputErr(""); }}
                    onKeyDown={e=>e.key==="Enter"&&handleAddCustom()} />
                  <button className="btn btn-primary" onClick={handleAddCustom}
                    style={{ whiteSpace:"nowrap" }}>
                    <Plus size={14}/> Add
                  </button>
                </div>
                {inputErr && (
                  <div style={{ fontSize:12.5, color:"var(--red)", display:"flex", gap:6, alignItems:"center" }}>
                    <AlertTriangle size={12}/> {inputErr}
                  </div>
                )}
                {inputAddr.length===42 && customSym && (
                  <div style={{ fontSize:12.5, color:"var(--green)", display:"flex", gap:6, alignItems:"center" }}>
                    <CheckCircle2 size={12}/> Detected: <strong>{customSym as string}</strong>
                  </div>
                )}
                {custom.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"18px 0",
                    fontSize:13, color:"var(--text-4)" }}>
                    Paste any ERC-7984 wrapper address to decrypt its balance
                  </div>
                ) : custom.map(addr => (
                  <BalRow key={addr} wrapper={addr} cSymbol="ERC-7984"
                    symbol="—" decimals={18} chainId={chainId} session={!!session}
                    onRemove={()=>setCustom(prev=>prev.filter(a=>a!==addr))} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
