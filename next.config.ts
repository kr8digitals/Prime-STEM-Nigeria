import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/ai-models/[...file]": [
      "./node_modules/@vladmandic/human/dist/human.esm.js",
      "./node_modules/@vladmandic/human/models/blazeface.json",
      "./node_modules/@vladmandic/human/models/blazeface.bin",
      "./node_modules/@vladmandic/human/models/facemesh.json",
      "./node_modules/@vladmandic/human/models/facemesh.bin",
      "./node_modules/@vladmandic/human/models/iris.json",
      "./node_modules/@vladmandic/human/models/iris.bin",
      "./node_modules/@vladmandic/human/models/centernet.json",
      "./node_modules/@vladmandic/human/models/centernet.bin",
      "./node_modules/@vladmandic/human/models/antispoof.json",
      "./node_modules/@vladmandic/human/models/antispoof.bin",
      "./node_modules/@vladmandic/human/models/liveness.json",
      "./node_modules/@vladmandic/human/models/liveness.bin",
    ],
  },
};

export default nextConfig;
