import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED_MODEL_FILES = new Set([
  "blazeface.json",
  "blazeface.bin",
  "facemesh.json",
  "facemesh.bin",
  "iris.json",
  "iris.bin",
  "centernet.json",
  "centernet.bin",
  "antispoof.json",
  "antispoof.bin",
  "liveness.json",
  "liveness.bin",
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string[] }> }
) {
  const { file } = await context.params;
  const requested = (file || []).join("/");

  if (requested === "human.esm.js") {
    const esmPath = path.join(
      process.cwd(),
      "node_modules",
      "@vladmandic",
      "human",
      "dist",
      "human.esm.js"
    );
    if (!fs.existsSync(esmPath)) {
      return NextResponse.json({ error: "AI runtime not found" }, { status: 404 });
    }
    const buf = fs.readFileSync(esmPath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (!ALLOWED_MODEL_FILES.has(requested)) {
    return NextResponse.json({ error: "Model asset not permitted" }, { status: 404 });
  }

  const modelPath = path.join(
    process.cwd(),
    "node_modules",
    "@vladmandic",
    "human",
    "models",
    requested
  );
  if (!fs.existsSync(modelPath)) {
    return NextResponse.json({ error: "Model weight file missing" }, { status: 404 });
  }

  const buf = fs.readFileSync(modelPath);
  const contentType = requested.endsWith(".json")
    ? "application/json; charset=utf-8"
    : "application/octet-stream";

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
