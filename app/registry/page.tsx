"use client";
import { useState, useCallback, useEffect } from "react";
import { useChainId, usePublicClient } from "wagmi";
import {
  Database, ExternalLink, CheckCircle2,
  FlaskConical, Search, Radio, AlertTriangle, Check, Copy,
} from "lucide-react";
import { getPairs, getRegistry, REGISTRY_ABI, type Pair } from "@/lib/contracts";
import { short, copy, EXPLORER, friendlyErr } from "@/lib/utils";

type ActivityEvent = { token: string; wrapper: string; block: bigint; tx: string; live: boolean };

const SNIPPET = `// lib/contracts.ts
export const CUSTOM_PAIRS: CustomPair[] = [
  {
    chainId:    11155111,            // 1 = Mainnet, 11155111 = Sepolia
    symbol:     "MYTOKEN",
    name:       "My Custom Token",
    cSymbol:    "cMYTOKEN",
    underlying: "0xYourERC20Address...",
    wrapper:    "0xYourERC7984WrapperAddress...",
    decimals:   18,
    isMock:     false,
    isCustom:   true,
  },
];`;

export default function RegistryPage() {
  const chainId    = useChainId();
  const isSepolia  = chainId === 11155111;
  const registry   = getRegistry(chainId);
  const client     = usePublicClient();
  const localPairs = getPairs(chainId);

  const [filter,    setFilter]    = useState<"all"|"official"|"mock">("all");
  const [search,    setSearch]    = useState("");
  const [copied,    setCopied]    = useState<string|null>(null);
  const [activity,  setActivity]  = useState<ActivityEvent[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [loaded,    setLoaded]    = useState(false);
  const [activityErr, setActivityErr] = useState("");
  const [scanInfo,  setScanInfo]  = useState("");

  const backfill = useCallback(async () => {
    if (!client || loading) return;
    setLoading(true); setActivityErr(""); setLoaded(false);

    const RANGES = [500n, 200n, 50n];
    let lastErr: unknown = null;

    try {
      const latest = await client.getBlockNumber();

      for (const span of RANGES) {
        const from = latest > span ? latest - span : 0n;
        try {
          const logs = await client.getLogs({
            address:   registry,
            event:     REGISTRY_ABI[2],
            fromBlock: from,
            toBlock:   latest,
          });
          const evts: ActivityEvent[] = logs.map((l: { args?: { tokenAddress?: string; confidentialTokenAddress?: string }; blockNumber?: bigint; transactionHash?: string }) => ({
            token:   (l.args?.tokenAddress             ?? "") as string,
            wrapper: (l.args?.confidentialTokenAddress ?? "") as string,
            block:   l.blockNumber  ?? 0n,
            tx:      l.transactionHash ?? "",
            live:    false,
          }));
          setActivity(evts.reverse()); // newest first
          setScanInfo(`Checked blocks ${from.toString()} → ${latest.toString()}`);
          setLoaded(true);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (lastErr) throw lastErr;
    } catch (e: unknown) {
      const err = e as { message?: string };
      setActivityErr(friendlyErr(err?.message));
    } finally { setLoading(false); }
  }, [client, registry, loading]);

  useEffect(() => {
    setFilter("all"); setSearch("");
    setActivity([]); setLoaded(false); setActivityErr("");
    backfill();
  }, [chainId]);

  
  useEffect(() => {
    if (!client) return;
    let lastBlock: bigint | null = null;
    let cancelled = false;

    const tick = async () => {
      try {
        const latest = await client.getBlockNumber();
        if (lastBlock === null) { lastBlock = latest; return; } 
        if (latest <= lastBlock) return;

        const logs = await client.getLogs({
          address:   registry,
          event:     REGISTRY_ABI[2],
          fromBlock: lastBlock + 1n,
          toBlock:   latest,
        });
        lastBlock = latest;
        if (cancelled || logs.length === 0) return;

        const evts: ActivityEvent[] = logs.map((l: { args?: { tokenAddress?: string; confidentialTokenAddress?: string }; blockNumber?: bigint; transactionHash?: string }) => ({
          token:   (l.args?.tokenAddress             ?? "") as string,
          wrapper: (l.args?.confidentialTokenAddress ?? "") as string,
          block:   l.blockNumber  ?? 0n,
          tx:      l.transactionHash ?? "",
          live:    true,
        }));
        setActivity(prev => [...evts, ...prev].slice(0, 30));
        setActivityErr("");
      } catch (e: unknown) {
        if (!cancelled) setActivityErr(friendlyErr((e as { message?: string })?.message));
      }
    };

    tick(); 
    const id = setInterval(tick, 4000);
    return () => { cancelled = true; clearInterval(id); };
  }, [client, registry]);

  const filtered = localPairs.filter(p => {
    const matchFilter = filter==="all" || (filter==="mock"?p.isMock:!p.isMock);
    const q = search.toLowerCase();
    const matchSearch = !q || p.symbol.toLowerCase().includes(q) || p.cSymbol.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) || p.underlying.toLowerCase().includes(q) || p.wrapper.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleCopy = (v: string) => { copy(v); setCopied(v); setTimeout(()=>setCopied(null), 1600); };

  const stats = [
    { label:"Total Pairs",   value:localPairs.length.toString(),                       color:"var(--gold)"   },
    { label:"Official",      value:localPairs.filter(p=>!p.isMock).length.toString(),  color:"var(--blue)"   },
    { label:"Mock / Testnet",value:localPairs.filter(p=>p.isMock).length.toString(),   color:"var(--amber)"  },
    { label:"Network",       value:isSepolia?"Sepolia":"Mainnet",                       color:isSepolia?"var(--amber)":"var(--green)" },
  ];

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:24 }}>

      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-hd-icon"
            style={{ background:"rgba(245,196,48,0.09)", border:"1px solid rgba(245,196,48,0.18)" }}>
            <Database size={22} color="var(--gold)" />
          </div>
          <div>
            <h1 className="hd-xl">Wrapper Registry</h1>
            <p className="sub">
              <button onClick={()=>handleCopy(registry)}
                className="addr" style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                {short(registry,10)}
              </button>
              {" · "}{isSepolia ? "Sepolia Testnet" : "Ethereum Mainnet"}
            </p>
          </div>
        </div>
        <div className="page-hd-right">
          <a href={`https://docs.zama.org/protocol/protocol-apps/addresses/${isSepolia?"testnet/sepolia":"mainnet/ethereum"}`}
            target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={12} /> Docs
          </a>
          <a href={EXPLORER(chainId, registry)} target="_blank" rel="noreferrer"
            className="btn btn-secondary btn-sm">
            <ExternalLink size={12} /> Etherscan
          </a>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-box">
            <div className="stat-box-label">{s.label}</div>
            <div className="stat-box-value" style={{ color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {(["all","official","mock"] as const).map(f => (
              <button key={f} className={`btn btn-sm ${filter===f?"btn-primary":"btn-secondary"}`}
                onClick={()=>setFilter(f)}>
                {f==="all"
                  ? `All (${localPairs.length})`
                  : f==="official"
                  ? `Official (${localPairs.filter(p=>!p.isMock).length})`
                  : `Mock (${localPairs.filter(p=>p.isMock).length})`}
              </button>
            ))}
          </div>
          <div style={{ position:"relative", minWidth:200 }}>
            <Search size={12} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text-4)", pointerEvents:"none" }} />
            <input className="input" style={{ paddingLeft:32, fontSize:13 }}
              placeholder="Search symbol, name, address…"
              value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <Database size={30} style={{ color:"var(--text-4)" }} />
            <div className="empty-title">No pairs found</div>
            <div className="empty-desc">Try adjusting your filter or search term.</div>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table className="reg-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>ERC-20 Address</th>
                  <th>ERC-7984 Wrapper</th>
                  <th>Decimals</th>
                  <th>Status</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: Pair, i: number) => (
                  <tr key={`${p.wrapper}-${i}`}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{
                          width:32, height:32, borderRadius:8, flexShrink:0,
                          background:"rgba(245,196,48,0.08)", border:"1px solid rgba(245,196,48,0.14)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontFamily:"var(--font-hd)", fontSize:9.5, fontWeight:800, color:"var(--gold)",
                        }}>
                          {p.symbol.replace("Mock","").slice(0,4)}
                        </div>
                        <div>
                          <div style={{ fontSize:13.5, fontWeight:700 }}>{p.symbol}</div>
                          <div style={{ fontSize:11, color:"var(--text-4)" }}>{p.cSymbol}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <button className="addr" onClick={()=>handleCopy(p.underlying)}
                          style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                          {copied===p.underlying ? <><Check size={10} style={{display:"inline"}} /> copied</> : short(p.underlying)}
                        </button>
                        <a href={EXPLORER(chainId, p.underlying)} target="_blank" rel="noreferrer">
                          <ExternalLink size={9} style={{ color:"var(--text-4)" }} />
                        </a>
                      </div>
                    </td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <button className="addr" onClick={()=>handleCopy(p.wrapper)}
                          style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                          {copied===p.wrapper ? <><Check size={10} style={{display:"inline"}} /> copied</> : short(p.wrapper)}
                        </button>
                        <a href={EXPLORER(chainId, p.wrapper)} target="_blank" rel="noreferrer">
                          <ExternalLink size={9} style={{ color:"var(--text-4)" }} />
                        </a>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize:12 }}>{p.decimals}</td>
                    <td><span className="badge badge-green"><CheckCircle2 size={10} /> Valid</span></td>
                    <td>
                      {p.isCustom
                        ? <span className="badge badge-purple">Custom</span>
                        : p.isMock
                        ? <span className="badge badge-amber"><FlaskConical size={10} /> Mock</span>
                        : <span className="badge badge-blue">Official</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div>
        <div className="section-hd">
          <span className="section-hd-label">Live Scanner</span>
          <div className="section-hd-line" />
          <span className="badge badge-gold">Auto range</span>
        </div>
        <div className="card">
          <div className="card-head">
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Radio size={14} color="var(--gold)" />
              <span className="card-head-title">Registry Event Scanner</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={backfill} disabled={loading}>
              {loading ? <><div className="spin spin-sm" /> Scanning…</> : <><Radio size={12}/> Scan Now</>}
            </button>
          </div>
          <div className="card-body">
            <p style={{ fontSize:13, color:"var(--text-2)", margin:0, lineHeight:1.65 }}>
              Watches for <code style={{ fontFamily:"var(--font-mono)", fontSize:11.5, color:"var(--gold)" }}>
              ConfidentialTokenRegistered</code> events scans automatically on load, then keeps
              checking every few seconds for anything new on {isSepolia ? "Sepolia" : "Mainnet"}. {scanInfo && ` ${scanInfo}`}
            </p>

            {activityErr && (
              <div className="alert alert-amber">
                <AlertTriangle size={13} style={{ flexShrink:0, marginTop:1 }} />
                <span style={{ fontSize:12.5 }}>{activityErr}</span>
              </div>
            )}

            {loading && activity.length === 0 && (
              <div style={{ textAlign:"center", padding:"18px 0", color:"var(--text-4)", fontSize:12.5 }}>
                <div className="spin spin-sm" style={{ margin:"0 auto 8px" }} />
                Loading recent registry history…
              </div>
            )}

            {!loading && loaded && activity.length === 0 && !activityErr && (
              <div className="alert alert-green">
                <CheckCircle2 size={14} style={{ flexShrink:0 }} />
                <span style={{ fontSize:13 }}>
                  No new registrations found. Registry is current, still watching for anything new.
                </span>
              </div>
            )}

            {activity.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {activity.map((ev, i) => (
                  <div key={`${ev.tx}-${i}`} style={{
                    padding:"12px 14px", borderRadius:10,
                    background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.14)",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6, flexWrap:"wrap" }}>
                      <CheckCircle2 size={12} color="var(--green)" />
                      <span style={{ fontSize:12.5, fontWeight:600 }}>New pair registered</span>
                      <span className="badge badge-green" style={{ fontSize:9 }}>Block {ev.block.toString()}</span>
                      {ev.live && <span className="badge badge-gold" style={{ fontSize:9 }}>Just now</span>}
                    </div>
                    <div style={{ display:"flex", gap:10, paddingLeft:18, flexWrap:"wrap" }}>
                      <a href={EXPLORER(chainId, ev.token)} target="_blank" rel="noreferrer"
                        className="addr" style={{ color:"var(--gold)", fontSize:11 }}>
                        ERC-20: {short(ev.token,10)}
                      </a>
                      <a href={EXPLORER(chainId, ev.wrapper)} target="_blank" rel="noreferrer"
                        className="addr" style={{ color:"var(--gold)", fontSize:11 }}>
                        ERC-7984: {short(ev.wrapper,10)}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="section-hd">
          <span className="section-hd-label">Extensibility</span>
          <div className="section-hd-line" />
        </div>
        <div className="card">
          <div className="card-head">
            <span className="card-head-title">Adding a New Wrapper Pair</span>
            <span className="badge badge-purple">Local config</span>
          </div>
          <div className="card-body" style={{ gap:14 }}>
            <p style={{ fontSize:13, color:"var(--text-2)", lineHeight:1.7, margin:0 }}>
              This app's extensibility mechanism is a local config array the simplest, most
              auditable way to add a pair without redeploying or trusting a remote source.
              Add an entry to <code className="inline-code">CUSTOM_PAIRS</code> in{" "}
              <code className="inline-code">lib/contracts.ts</code> and it appears automatically
              in the Registry, Wrap, and Decrypt pages.
            </p>
            <pre className="code-block" style={{ position:"relative" }}>
              <button
                onClick={() => handleCopy(SNIPPET)}
                className="btn btn-secondary btn-sm"
                style={{ position:"absolute", top:10, right:10, padding:"5px 10px" }}
              >
                {copied === SNIPPET ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
              </button>
              <code>{SNIPPET}</code>
            </pre>
            <div className="info" style={{ marginTop: 0 }}>
              <AlertTriangle size={13} color="var(--gold)" style={{ flexShrink:0, marginTop:1 }} />
              <span>
                Before adding a pair, verify it against the onchain registry using{" "}
                <code className="inline-code">getConfidentialTokenAddress(erc20Address)</code> on
                the registry contract, this confirms the wrapper is officially registered and
                still valid (not revoked). The <strong style={{ color:"var(--text)" }}>Live Scanner</strong> above
                above does this automatically, both on load and in real time.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}