/* ─────────────────────────────────────────────────────────────────
   Confidential Nexus — Official Registry Addresses & Pairs
   ALL addresses verified from:
   https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia
   https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum
   ─────────────────────────────────────────────────────────────────── */

export interface Pair {
  symbol:     string;
  name:       string;
  cSymbol:    string;
  underlying: `0x${string}`;
  wrapper:    `0x${string}`;
  decimals:   number;
  isMock:     boolean;
  isCustom?:  boolean;
}

interface CustomPair extends Pair {
  /** 1 = Ethereum Mainnet, 11155111 = Sepolia */
  chainId: number;
}

/* ── Registry contract ─────────────────────────────────────────── */
export const REGISTRY: Record<number, `0x${string}`> = {
  1:        "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
  11155111: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
};
export const getRegistry = (chainId: number): `0x${string}` =>
  REGISTRY[chainId] ?? REGISTRY[11155111];

/* ── Sepolia — 8 pairs (7 Mock + 1 Official) ──────────────────── */
const SEPOLIA_PAIRS: Pair[] = [
  {
    symbol:"USDC", name:"USD Coin (Mock)", cSymbol:"cUSDCMock",
    underlying:"0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
    wrapper:   "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
    decimals:6, isMock:true,
  },
  {
    symbol:"USDT", name:"Tether USD (Mock)", cSymbol:"cUSDTMock",
    underlying:"0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0",
    wrapper:   "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
    decimals:6, isMock:true,
  },
  {
    symbol:"WETH", name:"Wrapped Ether (Mock)", cSymbol:"cWETHMock",
    underlying:"0xff54739b16576FA5402F211D0b938469Ab9A5f3F",
    wrapper:   "0x46208622DA27d91db4f0393733C8BA082ed83158",
    decimals:18, isMock:true,
  },
  {
    symbol:"BRON", name:"Bron Token (Mock)", cSymbol:"cBRONMock",
    underlying:"0xFf021fB13cA64e5354c62c954b949a88cfDEb25E",
    wrapper:   "0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891",
    decimals:18, isMock:true,
  },
  {
    symbol:"ZAMA", name:"Zama Token (Mock)", cSymbol:"cZAMAMock",
    underlying:"0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57",
    wrapper:   "0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB",
    decimals:18, isMock:true,
  },
  {
    symbol:"tGBP", name:"TrueGBP (Mock)", cSymbol:"ctGBPMock",
    underlying:"0x93c931278A2aad1916783F952f94276eA5111442",
    wrapper:   "0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC",
    decimals:18, isMock:true,
  },
  {
    symbol:"XAUt", name:"Tether Gold (Mock)", cSymbol:"cXAUtMock",
    underlying:"0x24377AE4AA0C45ecEe71225007f17c5D423dd940",
    wrapper:   "0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7",
    decimals:6, isMock:true,
  },
  {
    symbol:"tGBP", name:"TrueGBP (Official)", cSymbol:"ctGBP",
    underlying:"0xf6Ef9ADB61A48E29E36bc873070A46A3D2667ff3",
    wrapper:   "0x167DC962808B32CFFFc7e14B5018c0bE06A3A208",
    decimals:18, isMock:false,
  },
];

/* ── Mainnet — 7 official pairs (read-only display) ───────────── */
const MAINNET_PAIRS: Pair[] = [
  {
    symbol:"USDC", name:"USD Coin", cSymbol:"cUSDC",
    underlying:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    wrapper:   "0xe978F22157048E5DB8E5d07971376e86671672B2",
    decimals:6, isMock:false,
  },
  {
    symbol:"USDT", name:"Tether USD", cSymbol:"cUSDT",
    underlying:"0xdAC17F958D2ee523a2206206994597C13D831ec7",
    wrapper:   "0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50",
    decimals:6, isMock:false,
  },
  {
    symbol:"WETH", name:"Wrapped Ether", cSymbol:"cWETH",
    underlying:"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    wrapper:   "0xda9396b82634Ea99243cE51258B6A5Ae512D4893",
    decimals:18, isMock:false,
  },
  {
    symbol:"BRON", name:"Bron Token", cSymbol:"cBRON",
    underlying:"0x3E5c63644E683549055b9Be8653de26E0B4CD36E",
    wrapper:   "0x85dE671c3bec1aDeD752c3Cea943521181C826bc",
    decimals:18, isMock:false,
  },
  {
    symbol:"ZAMA", name:"Zama Token", cSymbol:"cZAMA",
    underlying:"0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3",
    wrapper:   "0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071",
    decimals:18, isMock:false,
  },
  {
    symbol:"tGBP", name:"TrueGBP", cSymbol:"ctGBP",
    underlying:"0x00000000441378008EA67F4284A57932B1c000a5",
    wrapper:   "0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9",
    decimals:18, isMock:false,
  },
  {
    symbol:"XAUt", name:"Tether Gold", cSymbol:"cXAUt",
    underlying:"0x68749665FF8D2d112Fa859AA293F07A622782F38",
    wrapper:   "0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1",
    decimals:6, isMock:false,
  },
];

/* ─────────────────────────────────────────────────────────────────
   Adding a new ERC-20 ↔ ERC-7984 pair
   ─────────────────────────────────────────────────────────────────
   This is the app's documented mechanism for adding pairs that are
   not yet indexed by the local lists above (e.g. a pair you deployed
   yourself, or one registered on-chain after this build was cut).

   Add one entry below — no other file needs to change. The pair will
   automatically appear in the Registry, Wrap, and Decrypt pages.

   Example:
   {
     chainId:    11155111,
     symbol:     "MYTOKEN",
     name:       "My Custom Token",
     cSymbol:    "cMYTOKEN",
     underlying: "0xYourERC20Address...",
     wrapper:    "0xYourERC7984WrapperAddress...",
     decimals:   18,
     isMock:     false,
     isCustom:   true,
   },

   See README.md → "Adding a New Wrapper Pair" for the full guide,
   including how to verify a pair against the on-chain registry first.
   ─────────────────────────────────────────────────────────────────── */
export const CUSTOM_PAIRS: CustomPair[] = [
  // Add your pairs here.
];

export const getPairs     = (chainId: number): Pair[] =>
  chainId === 11155111
    ? [...SEPOLIA_PAIRS, ...CUSTOM_PAIRS.filter(p => p.chainId === 11155111)]
    : [...MAINNET_PAIRS, ...CUSTOM_PAIRS.filter(p => p.chainId === 1)];

export const getMockPairs = (chainId: number): Pair[] =>
  getPairs(chainId).filter(p => p.isMock);

/* ── ABIs ──────────────────────────────────────────────────────── */
export const ERC20_ABI = [
  { name:"balanceOf", type:"function", stateMutability:"view",
    inputs:[{name:"a",type:"address"}], outputs:[{type:"uint256"}] },
  { name:"allowance", type:"function", stateMutability:"view",
    inputs:[{name:"o",type:"address"},{name:"s",type:"address"}],
    outputs:[{type:"uint256"}] },
  { name:"approve",   type:"function", stateMutability:"nonpayable",
    inputs:[{name:"s",type:"address"},{name:"a",type:"uint256"}],
    outputs:[{type:"bool"}] },
  { name:"symbol",    type:"function", stateMutability:"view",
    inputs:[], outputs:[{type:"string"}] },
  { name:"decimals",  type:"function", stateMutability:"view",
    inputs:[], outputs:[{type:"uint8"}] },
  { name:"mint",      type:"function", stateMutability:"nonpayable",
    inputs:[{name:"to",type:"address"},{name:"amount",type:"uint256"}],
    outputs:[] },
] as const;

export const REGISTRY_ABI = [
  { name:"getTokenPairsCount", type:"function", stateMutability:"view",
    inputs:[], outputs:[{type:"uint256"}] },
  { name:"getTokenPairAt", type:"function", stateMutability:"view",
    inputs:[{name:"index",type:"uint256"}],
    outputs:[{name:"tokenAddress",type:"address"},
             {name:"confidentialTokenAddress",type:"address"}] },
  { type:"event", name:"ConfidentialTokenRegistered",
    inputs:[
      {name:"tokenAddress",            type:"address", indexed:true },
      {name:"confidentialTokenAddress",type:"address", indexed:false},
    ] },
] as const;
