import type { NextConfig } from "next";
import path from "path";

const shim = path.resolve(__dirname, "./lib/firestore-shim.ts");

const nextConfig: NextConfig = {
    reactCompiler: true,

    // Always route firebase/firestore imports through the Postgres shim.
    // Firebase Auth (firebase/auth) is intentionally NOT aliased — it still
    // handles user authentication.
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
