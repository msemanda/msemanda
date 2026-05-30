import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

// Read ISDBREMOTE from constants.tsx so there's a single source of truth
function readIsDbRemote(): boolean {
    try {
        const src = fs.readFileSync(
            path.join(__dirname, "helpers", "constants.tsx"),
            "utf-8"
        );
        const m = src.match(/export const ISDBREMOTE\s*=\s*(true|false)/);
        return m?.[1] === "true";
    } catch {
        return true; // safe default: use Firebase
    }
}

const ISDBREMOTE = readIsDbRemote();
const shim = path.resolve(__dirname, "./lib/firestore-shim.ts");

const nextConfig: NextConfig = {
    reactCompiler: true,

    // Turbopack alias (Next.js 16 default dev bundler)
    ...(ISDBREMOTE ? {} : {
        turbopack: {
            resolveAlias: {
                "firebase/firestore": "./lib/firestore-shim",
            },
        },
    }),

    // Webpack alias (next build / --webpack)
    webpack(config) {
        if (!ISDBREMOTE) {
            config.resolve.alias = {
                ...config.resolve.alias,
                "firebase/firestore": shim,
            };
        }
        return config;
    },
};

export default nextConfig;
