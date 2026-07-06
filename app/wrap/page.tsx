"use client";

import { useState } from "react";
import { useChainId, useAccount, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import {
  ArrowRight, ArrowLeftRight, Shield, Unlock, Info,
  CheckCircle2, AlertCircle, ExternalLink, Zap, WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useShield, useUnshield } from "@zama-fhe/react-sdk";
import { getPairs, ERC20_ABI } from "@/lib/contracts";
import { formatUnits, EXPLORER, short, friendlyErr } from "@/lib/utils";

export default function WrapPage() {
  const chainId   = useChainId();
  const isSepolia = chainId === 11155111;
  const { address, isConnected } = useAccount();
  const pairs = getPairs(chainId);

  const [tab,     setTab]     = useState<"wrap"|"unwrap">("wrap");
  const [pairIdx, setPairIdx] = useState(0);
  const [amount,  setAmount]  = useState("");
  const [errMsg,  setErrMsg]  = useState("");
  const [doneTx,  setDoneTx]  = useState<`0x${string}`|undefined>();

  const pair = pairs[pairIdx] ?? pairs[0];

  const amountBig = (() => {
    try { return amount ? parseUnits(amount, pair?.decimals ?? 18) : 0n; } catch { return 0n; }
  })();

  const { data: erc20Bal } = useReadContract({
    address:      pair?.underlying,
    abi:          ERC20_ABI,
    functionName: "balanceOf",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address && tab === "wrap" && !!pair },
  });
  const balStr = erc20Bal !== undefined ? formatUnits(erc20Bal as bigint, pair?.decimals ?? 18) : "—";

  const reset = () => { setErrMsg(""); setDoneTx(undefined); setAmount(""); };

  const shield = useShield(
    { address: pair?.wrapper ?? "0x0000000000000000000000000000000000000000",
      optimistic: true },
    { onSuccess: r => { setDoneTx(r?.txHash); setErrMsg(""); },
      onError:   e => setErrMsg(friendlyErr(e?.message)) },
  );

  const unshield = useUnshield(
    pair?.wrapper ?? "0x0000000000000000000000000000000000000000",
    { onSuccess: r => { setDoneTx(r?.txHash); setErrMsg(""); },
      onError:   e => setErrMsg(friendlyErr(e?.message)) },
  );

  const isRpc = errMsg.includes("Network error") || errMsg.includes("RPC");
  const isFhe = errMsg.includes("FHE worker") || errMsg.includes("gateway") || errMsg.includes("not installed");

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:22 }}>

      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-hd-icon"
            style={{ background:"rgba(34,197,94,0.09)", border:"1px solid rgba(34,197,94,0.18)" }}>
            <ArrowLeftRight size={22} color="var(--green)" />
          </div>
          <div>
            <h1 className="hd-xl">Wrap Terminal</h1>
            <p className="sub">Shield ERC-20 → ERC-7984 on Sepolia, or unshield back</p>
          </div>
        </div>
        <div className="tabs">
          <button className={`tab-btn ${tab==="wrap"?"tab-active":""}`}
            onClick={()=>{ setTab("wrap"); reset(); }}>
            <Shield size={13}/> Shield
          </button>
          <button className={`tab-btn ${tab==="unwrap"?"tab-active":""}`}
            onClick={()=>{ setTab("unwrap"); reset(); }}>
            <Unlock size={13}/> Unshield
          </button>
        </div>
      </div>

      {!isSepolia && (
        <div className="alert alert-amber">
          <WifiOff size={15} style={{ flexShrink:0, marginTop:1 }} />
          <div>
            <strong style={{ display:"block", marginBottom:3 }}>Switch to Sepolia Testnet</strong>
            <span style={{ fontSize:12.5 }}>
              Wrap / Unshield operations require the Zama relayer which is live on Sepolia.
              Switch your wallet to Sepolia to use this feature.
            </span>
          </div>
        </div>
      )}

      {(isRpc || isFhe) && (
        <div className="alert alert-amber">
          <WifiOff size={15} style={{ flexShrink:0, marginTop:1 }} />
          <div style={{ flex:1 }}>
            <strong style={{ display:"block", marginBottom:3 }}>
              {isFhe ? "FHE SDK Required" : "Network Error"}
            </strong>
            <span style={{ fontSize:12.5 }}>{errMsg}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={reset} style={{ flexShrink:0 }}>
            Dismiss
          </button>
        </div>
      )}

      <div className="wrap-grid">
        <div className="card">

          <div style={{ padding:"18px 20px 0", display:"flex", flexDirection:"column", gap:8 }}>
            <label className="field-label">Token Pair</label>
            <select className="input" value={pairIdx}
              onChange={e=>{ setPairIdx(+e.target.value); reset(); }}>
              {pairs.map((p,i) => (
                <option key={`${p.wrapper}-${i}`} value={i}>
                  {p.symbol} ↔ {p.cSymbol}{p.isMock ? "  (Testnet Mock)" : ""}
                </option>
              ))}
            </select>
          </div>

          {pair && (
            <div style={{ padding:"16px 20px" }}>
              <div className="flow-box">
                <div className="flow-token">
                  <div className="flow-lbl">{tab==="wrap"?"You send":"You burn"}</div>
                  <div className="flow-sym">{tab==="wrap" ? pair.symbol : pair.cSymbol}</div>
                  <div className="flow-addr">{short(tab==="wrap" ? pair.underlying : pair.wrapper, 8)}</div>
                  <span className={`badge ${tab==="wrap"?"badge-blue":"badge-gold"}`}
                    style={{ marginTop:4, fontSize:9.5 }}>
                    {tab==="wrap"?"ERC-20":"ERC-7984"}
                  </span>
                </div>
                <ArrowRight size={20} color="var(--gold)" style={{ flexShrink:0 }} />
                <div className="flow-token">
                  <div className="flow-lbl">You receive</div>
                  <div className="flow-sym" style={{ color:"var(--gold)" }}>
                    {tab==="wrap" ? pair.cSymbol : pair.symbol}
                  </div>
                  <div className="flow-addr">{short(tab==="wrap" ? pair.wrapper : pair.underlying, 8)}</div>
                  <span className={`badge ${tab==="wrap"?"badge-gold":"badge-blue"}`}
                    style={{ marginTop:4, fontSize:9.5 }}>
                    {tab==="wrap"?"ERC-7984":"ERC-20"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding:"0 20px 18px", display:"flex", flexDirection:"column", gap:8 }}>
            <div className="field-row">
              <label className="field-label">
                Amount ({tab==="wrap" ? pair?.symbol : pair?.cSymbol})
              </label>
              {isConnected && tab==="wrap" && erc20Bal !== undefined && (
                <span className="field-hint">
                  Balance: <strong style={{ color:"var(--text)" }}>{balStr}</strong>
                </span>
              )}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input type="number" min="0" step="any" placeholder="0.00"
                className="input" value={amount}
                onChange={e=>{ setAmount(e.target.value); setErrMsg(""); }} />
              {tab==="wrap" && erc20Bal && (erc20Bal as bigint)>0n && (
                <button className="btn btn-secondary" style={{ whiteSpace:"nowrap" }}
                  onClick={()=>setAmount(balStr)}>Max</button>
              )}
            </div>
            {tab==="unwrap" && (
              <div className="info-box" style={{ marginTop:2 }}>
                <Info size={12} color="var(--gold)" style={{ flexShrink:0 }} />
                <span style={{ fontSize:12 }}>
                  Check your {pair?.cSymbol} balance on the{" "}
                  <Link href="/decrypt" style={{ color:"var(--gold)", fontWeight:600, textDecoration:"none" }}>
                    Decrypt page →
                  </Link>
                </span>
              </div>
            )}
          </div>

          <div style={{ padding:"0 20px 22px", display:"flex", flexDirection:"column", gap:10 }}>
            {!isConnected ? (
              <div className="empty" style={{ padding:"28px 0" }}>
                <Zap size={26} style={{ color:"var(--text-4)" }} />
                <div className="empty-title">Connect your wallet</div>
                <div className="empty-desc">Connect on Sepolia to shield or unshield tokens.</div>
              </div>
            ) : doneTx ? (
              <>
                <div className="alert alert-green">
                  <CheckCircle2 size={14} style={{ flexShrink:0 }} />
                  <span style={{ fontSize:13 }}>
                    {tab==="wrap"
                      ? `Shielded ${amount} ${pair?.symbol} → ${pair?.cSymbol}`
                      : `Unshield requested: ${amount} ${pair?.cSymbol} → ${pair?.symbol}`}
                  </span>
                  <a href={EXPLORER(chainId, doneTx, "tx")} target="_blank" rel="noreferrer"
                    style={{ color:"var(--green)", fontSize:12, marginLeft:"auto",
                      whiteSpace:"nowrap", textDecoration:"none",
                      display:"flex", alignItems:"center", gap:3 }}>
                    View Tx <ExternalLink size={9}/>
                  </a>
                </div>
                {tab==="wrap" && (
                  <div className="info-box">
                    <Info size={12} color="var(--gold)" style={{ flexShrink:0 }} />
                    <span style={{ fontSize:12 }}>
                      Your {pair?.cSymbol} is encrypted onchain.{" "}
                      <Link href="/decrypt"
                        style={{ color:"var(--gold)", fontWeight:600, textDecoration:"none" }}>
                        Decrypt to see balance →
                      </Link>
                    </span>
                  </div>
                )}
                <button className="btn btn-secondary btn-lg" onClick={reset}>
                  {tab==="wrap" ? "Shield another" : "Unshield another"}
                </button>
              </>
            ) : errMsg && !isRpc && !isFhe ? (
              <>
                <div className="alert alert-red">
                  <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ fontSize:12.5, wordBreak:"break-word" }}>{errMsg}</span>
                </div>
                <button className="btn btn-secondary" onClick={reset}>Try again</button>
              </>
            ) : tab==="wrap" ? (
              <>
                <div className="info-box">
                  <Info size={12} color="var(--gold)" style={{ flexShrink:0 }} />
                  <span style={{ fontSize:12 }}>
                    ERC-20 approves and shields your tokens via the Zama SDK.
                  </span>
                </div>
                <button className="btn btn-primary btn-lg"
                  onClick={() => { reset(); shield.mutate({ amount: amountBig }); }}
                  disabled={shield.isPending || amountBig === 0n || !isSepolia}>
                  {shield.isPending
                    ? <><div className="spin spin-sm"/> Shielding…</>
                    : <><Shield size={14}/> Shield {amount||"0"} {pair?.symbol}</>}
                </button>
              </>
            ) : (
              <>
                <div className="info-box">
                  <Info size={12} color="var(--gold)" style={{ flexShrink:0 }} />
                  <span style={{ fontSize:12 }}>
                    Unshielding uses the Zama relayer, EIP-712 sign will be requested.
                  </span>
                </div>
                <button className="btn btn-primary btn-lg"
                  onClick={() => { reset(); unshield.mutate({ amount: amountBig }); }}
                  disabled={unshield.isPending || amountBig === 0n || !isSepolia}>
                  {unshield.isPending
                    ? <><div className="spin spin-sm"/> Unshielding…</>
                    : <><Unlock size={14}/> Unshield {amount||"0"} {pair?.cSymbol}</>}
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="card">
            <div className="card-head">
              <span className="card-head-title">Pair Details</span>
              <span className={`badge ${isSepolia?"badge-amber":"badge-green"}`}>
                {isSepolia ? "Sepolia" : "Mainnet"}
              </span>
            </div>
            {pair && (
              <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  { label:"ERC-20 Token",    badge:<span className="badge badge-blue">{pair.symbol}</span>,  addr:pair.underlying },
                  { label:"ERC-7984 Wrapper",badge:<span className="badge badge-gold">{pair.cSymbol}</span>, addr:pair.wrapper    },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                      letterSpacing:"0.07em", color:"var(--text-4)", fontFamily:"var(--font-mono)" }}>
                      {r.label}
                    </span>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      {r.badge}
                      <a href={EXPLORER(chainId, r.addr)} target="_blank" rel="noreferrer"
                        className="addr" style={{ fontSize:11 }}>
                        {short(r.addr)} <ExternalLink size={9} style={{ display:"inline" }}/>
                      </a>
                    </div>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:"var(--text-3)" }}>Decimals</span>
                  <span className="mono">{pair.decimals}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:"var(--text-3)" }}>Token type</span>
                  <span className={`badge ${pair.isMock?"badge-amber":"badge-green"}`}>
                    {pair.isMock ? "Mock (Testnet)" : "Official"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <span className="card-head-title">{tab==="wrap"?"Shield Flow":"Unshield Flow"}</span>
            </div>
            <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
              {(tab==="wrap"
                ? ["SDK approves ERC-20 allowance",
                   `Calls wrap() on the ERC-7984 contract`,
                   "Balance encrypted onchain via Zama FHE",
                   `${pair?.cSymbol} credited to your address`]
                : ["Signs EIP-712 to authorize Zama relayer",
                   "Relayer decrypts your balance handle",
                   "Burns ERC-7984 via UnwrapRequested",
                   `${pair?.symbol} returned to your wallet`]
              ).map((step, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{
                    width:22, height:22, borderRadius:"50%", flexShrink:0,
                    background:"rgba(245,196,48,0.09)", border:"1px solid rgba(245,196,48,0.18)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:700, color:"var(--gold)",
                  }}>{i+1}</div>
                  <span style={{ fontSize:12, color:"var(--text-2)", lineHeight:1.65, marginTop:3 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
