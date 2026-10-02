import type { NextConfig } from "next";
import path from "path";

const shim = path.resolve(__dirname, "./lib/firestore-shim.ts");

const nextConfig: NextConfig = {
    reactCompiler: true,

    // Route every `firebase/firestore` import through the Postgres shim.
    // The app no longer depends on the real "firebase" package at all — this
    // alias resolves regardless of whether it's installed — but ~140 pages
    // still literally import from "firebase/firestore" for API-shape
    // compatibility with lib/firestore-shim.ts, so the alias stays.
    turbopack: {
        resolveAlias: {
            "firebase/firestore": "./lib/firestore-shim",
        },
    },

    webpack(config) {
        config.resolve.alias = {
            ...config.resolve.alias,
            "firebase/firestore": shim,
        };
        return config;
    },
};

export default nextConfig;
