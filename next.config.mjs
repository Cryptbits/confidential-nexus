import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const _require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let sdkInstalled = false;
try {
  _require.resolve("@zama-fhe/react-sdk");
  sdkInstalled = true;
} catch {
  sdkInstalled = false;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.module.rules.push({ test: /\.wasm$/, type: "webassembly/async" });

    if (!sdkInstalled) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@zama-fhe/sdk/viem":        path.resolve(__dirname, "lib/fhe-stub-modules/viem.ts"),
        "@zama-fhe/react-sdk":       path.resolve(__dirname, "lib/fhe-stubs.ts"),
        "@zama-fhe/sdk/web":         path.resolve(__dirname, "lib/fhe-stub-modules/web.ts"),
        "@zama-fhe/sdk/chains":      path.resolve(__dirname, "lib/fhe-stub-modules/chains.ts"),
      };
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
      encoding: false,
    };

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin"    },
        ],
      },
    ];
  },
};

export default nextConfig;
