import { formatUnits as viemFmt } from "viem";

export const short = (addr: string, chars = 6) =>
  addr ? `${addr.slice(0, chars)}…${addr.slice(-4)}` : "";

export const formatUnits = (val: bigint, decimals: number): string => {
  const s = viemFmt(val, decimals);
  const n = parseFloat(s);
  if (n === 0) return "0";
  if (n < 0.000001) return "<0.000001";
  const [intPart, decPart] = s.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (!decPart) return grouped;
  const trimmedDec = decPart.slice(0, n < 1 ? 6 : 4).replace(/0+$/, "");
  return trimmedDec ? `${grouped}.${trimmedDec}` : grouped;
};

export const EXPLORER = (
  chainId: number,
  addr: string,
  type: "address" | "tx" = "address"
) => {
  const base = chainId === 11155111
    ? "https://sepolia.etherscan.io"
    : "https://etherscan.io";
  return `${base}/${type}/${addr}`;
};

export const copy = (text: string) => {
  try { navigator.clipboard.writeText(text); } catch { /* noop */ }
};

export const friendlyErr = (raw: string | undefined): string => {
  if (!raw) return "Something went wrong. Please try again.";
  if (raw.includes("Failed to fetch") || raw.includes("HTTP request failed") ||
      raw.includes("NetworkError") || raw.includes("fetch"))
    return "Network error — RPC endpoint unreachable. Make sure your wallet is on Sepolia with a working provider.";
  if (raw.includes("Failed to initialize FHE worker") || raw.includes("FHE worker"))
    return "FHE worker could not initialize. Switch to Sepolia where the Zama gateway is active, then reconnect your wallet.";
  if (raw.includes("User rejected") || raw.includes("user rejected") ||
      raw.includes("ACTION_REJECTED"))
    return "Transaction cancelled in wallet.";
  if (raw.includes("insufficient funds"))
    return "Insufficient ETH for gas. Add Sepolia ETH and try again.";
  if (raw.includes("Invalid parameters") || raw.includes("invalid params") || raw.includes("InvalidParamsRpcError"))
    return "The connected RPC provider rejected this request (a known limit on some free-tier endpoints). This doesn't affect wrapping, unwrapping, or decrypting — only this live scan.";
  return raw.length > 220 ? raw.slice(0, 220) + "…" : raw;
};
