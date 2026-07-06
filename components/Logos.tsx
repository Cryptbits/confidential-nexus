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
      <polygon points={pts2} fill="none" stroke="#000" strokeWidth="0.6" strokeOpacity="0.12"/>
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
