/* ─────────────────────────────────────────────────────────────
   Logos — inline SVG components, zero external dependencies
   ───────────────────────────────────────────────────────────── */

/** Official Zama mark: gold rounded square + precise black Z letterform */
export function ZamaLogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-label="Zama">
      <rect width="28" height="28" rx="6" fill="#F5C430"/>
      {/* Bold geometric Z — top bar, diagonal, bottom bar */}
      <path
        d="M7 8.5h14M21 8.5L7 19.5M7 19.5h14"
        stroke="#000"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Zama wordmark: mark + "Zama" text */
export function ZamaWordmark({ markSize = 26 }: { markSize?: number }) {
  const textSize = Math.round(markSize * 0.56);
  const gap      = 10;
  const textW    = textSize * 3.1; // generous estimate for "Zama" in bold Space Grotesk
  const totalW   = markSize + gap + textW + 6; // +6px right padding so nothing clips
  return (
    <svg
      width={totalW}
      height={markSize}
      viewBox={`0 0 ${totalW} ${markSize}`}
      fill="none"
      aria-label="Zama"
    >
      {/* Mark */}
      <rect width={markSize} height={markSize} rx="5" fill="#F5C430"/>
      <path
        d={`M${markSize*0.25} ${markSize*0.305}h${markSize*0.5}
            M${markSize*0.75} ${markSize*0.305}
            L${markSize*0.25} ${markSize*0.695}
            M${markSize*0.25} ${markSize*0.695}h${markSize*0.5}`}
        stroke="#000"
        strokeWidth={markSize * 0.097}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wordmark text */}
      <text
        x={markSize + gap}
        y={markSize * 0.72}
        fontFamily="'Space Grotesk', system-ui, sans-serif"
        fontSize={textSize + 2}
        fontWeight="700"
        fill="#F5C430"
        letterSpacing="-0.02em"
      >
        Zama
      </text>
    </svg>
  );
}

/**
 * Confidential Nexus badge — gold hexagon (FHE lattice reference) with bold
 * black "CN" monogram. Flat, works at any size.
 */
export function CnLogo({ size = 32 }: { size?: number }) {
  const s  = size;
  const cx = s / 2;
  const cy = s / 2;
  const r  = s * 0.47;
  const pts: string = [0, 1, 2, 3, 4, 5]
    .map(i => {
      const a = (Math.PI / 180) * (60 * i - 90);
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    })
    .join(" ");
  /* inner ring offset */
  const ri = r - s * 0.07;
  const pts2: string = [0, 1, 2, 3, 4, 5]
    .map(i => {
      const a = (Math.PI / 180) * (60 * i - 90);
      return `${cx + ri * Math.cos(a)},${cy + ri * Math.sin(a)}`;
    })
    .join(" ");

  const fs = Math.round(s * 0.34);

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-label="Confidential Nexus">
      {/* Outer filled hexagon */}
      <polygon points={pts} fill="#F5C430"/>
      {/* Subtle inner outline ring */}
      <polygon points={pts2} fill="none" stroke="#000" strokeWidth="0.6" strokeOpacity="0.12"/>
      {/* CN monogram */}
      <text
        x={cx}
        y={cy + fs * 0.36}
        textAnchor="middle"
        fontFamily="'Space Grotesk', system-ui, sans-serif"
        fontSize={fs}
        fontWeight="800"
        fill="#000"
        letterSpacing="-0.5"
      >
        CN
      </text>
    </svg>
  );
}

/** Full Confidential Nexus wordmark for topbar: badge + text */
export function CnWordmark() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
      <CnLogo size={30} />
      <span style={{
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        color: "#ededed",
      }}>
        Confidential{" "}
        <span style={{ color: "#F5C430" }}>Nexus</span>
      </span>
    </div>
  );
}
