import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "sharp"],
  outputFileTracingIncludes: {
    "/api/podcasts/transcribe": [
      "./node_modules/onnxruntime-node/bin/**/*",
      "./node_modules/.pnpm/onnxruntime-node*/node_modules/onnxruntime-node/bin/**/*",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
