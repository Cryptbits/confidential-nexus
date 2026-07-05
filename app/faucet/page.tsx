"use client";
import { useState } from "react";
import { useChainId, useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { Droplets, CheckCircle2, ExternalLink, AlertTriangle, FlaskConical, ArrowRight, Zap, Info } from "lucide-react";
import Link from "next/link";
import { getMockPairs, ERC20_ABI } from "@/lib/contracts";
import { EXPLORER, formatUnits } from "@/lib/utils";

export default function FaucetPage() {
  const chainId   = useChainId();
  const isSepolia = chainId === 11155111;
  const { address, isConnected } = useAccount();
  const mocks = getMockPairs(chainId);

  const [selIdx, setSelIdx] = useState(0);
  const [txHash, setTxHash] = useState<`0x${string}`|undefined>();
  const [minting,setMinting]= useState(false);
  const [err,    setErr]    = useState("");

  const sel    = mocks[selIdx];
  const mintAmt= sel ? parseUnits("1000", sel.decimals) : 0n;

  const { data: bal, refetch: refetchBal } = useReadContract({
    address:      sel?.underlying,
    abi:          ERC20_ABI,
    functionName: "balanceOf",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address && !!sel && isSepolia },
  });

  const { writeContractAsync } = useWriteContract();
  const { isLoading: txPending, isSuccess: txOk } =
    useWaitForTransactionReceipt({ hash: txHash });

  const handleMint = async () => {
    if (!sel || !address) return;
    setErr(""); setMinting(true);
    try {
      const hash = await writeContractAsync({
        address:      sel.underlying,
        abi:          ERC20_ABI,
        functionName: "mint",
        args:         [address, mintAmt],
      });
      setTxHash(hash);
      refetchBal();
    } catch (e: unknown) {
      const er = e as { shortMessage?: string; message?: string };
      setErr(er?.shortMessage ?? er?.message ?? "Mint failed");
    } finally { setMinting(false); }
  };

  const isLoading = minting || txPending;
  const balStr    = bal !== undefined && sel ? formatUnits(bal as bigint, sel.decimals) : "—";

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:22 }}>

      {/* Page header */}
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-hd-icon"
            style={{ background:"rgba(245,158,11,0.09)", border:"1px solid rgba(245,158,11,0.18)" }}>
            <Droplets size={22} color="var(--amber)" />
          </div>
          <div>
            <h1 className="hd-xl">Sepolia Faucet</h1>
            <p className="sub">Mint official cTokenMock testnet tokens, max 1,000,000 per call</p>
          </div>
        </div>
        <span className="badge badge-amber" style={{ fontSize:12, padding:"6px 14px" }}>
          Testnet Only
        </span>
      </div>

      {/* Wrong network */}
      {!isSepolia && (
        <div className="card">
          <div className="card-body" style={{ gap:16 }}>
            <div className="alert alert-amber">
              <AlertTriangle size={15} style={{ flexShrink:0 }} />
              <div>
                <strong style={{ display:"block", marginBottom:4 }}>Switch to Sepolia Testnet</strong>
                <span style={{ fontSize:12.5 }}>
                  The faucet mints official Zama cTokenMocks which only exist on Sepolia.
                  Switch your wallet network to Sepolia to continue.
                </span>
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Link href="/registry" className="btn btn-secondary btn-sm">View Registry</Link>
              <Link href="/snippets" className="btn btn-secondary btn-sm">Dev Snippets</Link>
            </div>
          </div>
        </div>
      )}

      {isSepolia && (
        <>
          {/* Info */}
          <div className="info-box">
            <Info size={13} color="var(--gold)" style={{ flexShrink:0, marginTop:1 }} />
            <span style={{ fontSize:13 }}>
              Each mock token exposes a public{" "}
              <code style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--gold)" }}>
                mint(address, uint256)
              </code>{" "}
              function limited to <strong style={{ color:"var(--text)" }}>1,000,000 tokens per call</strong>.
              Official addresses from{" "}
              <a href="https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia"
                target="_blank" rel="noreferrer"
                style={{ color:"var(--gold)", textDecoration:"none", fontWeight:600 }}>
                docs.zama.org <ExternalLink size={10} style={{ display:"inline" }} />
              </a>
            </span>
          </div>

          <div>
            <div className="section-hd">
              <span className="section-hd-label">Select Token</span>
              <div className="section-hd-line" />
              <span className="badge badge-gold">{mocks.length} mocks</span>
            </div>

            <div className="card">
              <div className="card-head">
                <span className="card-head-title">Official Sepolia cTokenMocks</span>
              </div>
              <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:16 }}>

                {/* Token pills */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {mocks.map((p,i) => (
                    <button key={p.underlying}
                      className={`btn btn-sm ${selIdx===i?"btn-primary":"btn-secondary"}`}
                      onClick={()=>{ setSelIdx(i); setTxHash(undefined); setErr(""); }}>
                      <FlaskConical size={11}/> {p.cSymbol}
                    </button>
                  ))}
                </div>

                {sel && (
                  <div style={{
                    display:"grid", gridTemplateColumns:"1fr 1fr",
                    gap:14, padding:"16px 18px", borderRadius:12,
                    background:"rgba(245,196,48,0.04)", border:"1px solid rgba(245,196,48,0.1)",
                    fontSize:12,
                  }}>
                    {[
                      { lbl:"ERC-20 (mintable)", addr:sel.underlying },
                      { lbl:"ERC-7984 Wrapper",  addr:sel.wrapper    },
                    ].map(r => (
                      <div key={r.lbl}>
                        <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                          letterSpacing:"0.07em", color:"var(--text-4)", marginBottom:6,
                          fontFamily:"var(--font-mono)" }}>{r.lbl}</div>
                        <div className="addr" style={{ fontSize:11 }}>{r.addr}</div>
                        <a href={EXPLORER(11155111, r.addr)} target="_blank" rel="noreferrer"
                          style={{ color:"var(--gold)", fontSize:11, display:"inline-flex",
                            alignItems:"center", gap:3, marginTop:5, textDecoration:"none" }}>
                          Etherscan <ExternalLink size={9}/>
                        </a>
                      </div>
                    ))}
                    {isConnected && (
                      <>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                            letterSpacing:"0.07em", color:"var(--text-4)", marginBottom:6,
                            fontFamily:"var(--font-mono)" }}>Your Balance</div>
                          <div style={{ fontSize:20, fontWeight:800, color:"var(--text)",
                            fontFamily:"var(--font-hd)", letterSpacing:"-0.02em" }}>
                            {balStr} <span style={{ fontSize:12, color:"var(--text-3)", fontWeight:500 }}>{sel.symbol}</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                            letterSpacing:"0.07em", color:"var(--text-4)", marginBottom:6,
                            fontFamily:"var(--font-mono)" }}>Will Mint</div>
                          <div style={{ fontSize:20, fontWeight:800, color:"var(--gold)",
                            fontFamily:"var(--font-hd)", letterSpacing:"-0.02em" }}>
                            1,000 <span style={{ fontSize:12, color:"var(--text-3)", fontWeight:500 }}>{sel.symbol}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="section-hd">
              <span className="section-hd-label">Claim Tokens</span>
              <div className="section-hd-line" />
            </div>
            <div className="card">
              <div className="card-body" style={{ gap:16 }}>
                {!isConnected ? (
                  <div className="empty" style={{ padding:"28px 0" }}>
                    <Zap size={28} style={{ color:"var(--text-4)" }} />
                    <div className="empty-title">Connect your wallet</div>
                    <div className="empty-desc">Connect a Sepolia wallet to mint test tokens.</div>
                  </div>
                ) : txOk ? (
                  <>
                    <div className="alert alert-green">
                      <CheckCircle2 size={14} style={{ flexShrink:0 }} />
                      <span style={{ fontSize:13 }}>
                        Minted <strong>1,000 {sel?.symbol}</strong> successfully!
                        Ready to wrap into <strong>{sel?.cSymbol}</strong>.
                      </span>
                      {txHash && (
                        <a href={EXPLORER(11155111, txHash, "tx")} target="_blank" rel="noreferrer"
                          style={{ color:"var(--green)", fontSize:12, display:"flex", alignItems:"center",
                            gap:3, marginLeft:"auto", whiteSpace:"nowrap", textDecoration:"none" }}>
                          Tx <ExternalLink size={9}/>
                        </a>
                      )}
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button className="btn btn-secondary" style={{ flex:1 }}
                        onClick={()=>{ setTxHash(undefined); setErr(""); }}>
                        Mint more
                      </button>
                      <Link href="/wrap"
                        className="btn btn-primary" style={{ flex:1, textDecoration:"none", justifyContent:"center" }}>
                        Wrap {sel?.symbol} <ArrowRight size={13}/>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {err && (
                      <div className="alert alert-red">
                        <AlertTriangle size={13} style={{ flexShrink:0 }} />
                        <span style={{ fontSize:12.5 }}>{err}</span>
                      </div>
                    )}
                    <button className="btn btn-primary btn-lg"
                      onClick={handleMint} disabled={isLoading || !sel}>
                      {isLoading
                        ? <><div className="spin spin-sm"/> Minting…</>
                        : <><Droplets size={14}/> Mint 1,000 {sel?.symbol}</>}
                    </button>
                    <div style={{ fontSize:12, color:"var(--text-4)", textAlign:"center" }}>
                      Calls{" "}
                      <code style={{ fontFamily:"var(--font-mono)", fontSize:11 }}>
                        mint(address, {sel ? `1000 × 10^${sel.decimals}` : "…"})
                      </code>{" "}
                      on the mock ERC-20
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
