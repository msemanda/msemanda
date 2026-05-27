"use client";

import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";

interface LoadingScreenProps {
    label?: string;
}

export function LoadingScreen({ label = "Loading..." }: LoadingScreenProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-5"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/15 blur-2xl rounded-full" />
                    <motion.div
                        animate={{ scale: [1, 1.08, 1], rotate: [0, 4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="relative p-4 bg-white rounded-2xl shadow-premium border border-blue-50"
                    >
                        <HeartPulse className="h-8 w-8 text-blue-600" />
                    </motion.div>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">{label}</p>
            </motion.div>
        </div>
    );
}
