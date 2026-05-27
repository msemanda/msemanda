"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Plus, AlertCircle, CheckCircle2 } from "lucide-react";

const bloodInventory = [
    { group: "A+", available: 18, reserved: 3, total: 21 },
    { group: "A-", available: 6, reserved: 1, total: 7 },
    { group: "B+", available: 22, reserved: 5, total: 27 },
    { group: "B-", available: 4, reserved: 0, total: 4 },
    { group: "O+", available: 31, reserved: 8, total: 39 },
    { group: "O-", available: 8, reserved: 2, total: 10 },
    { group: "AB+", available: 12, reserved: 2, total: 14 },
    { group: "AB-", available: 3, reserved: 1, total: 4 },
];

const recentRequests = [
    { id: "BB001", patient: "Sarah Namutebi", group: "O+", units: 2, doctor: "Dr. Bwire", status: "FULFILLED", time: "08:45" },
    { id: "BB002", patient: "Alice Nakirya", group: "A+", units: 1, doctor: "Dr. Katongo", status: "PENDING", time: "09:30" },
    { id: "BB003", patient: "Peter Wanyama", group: "B-", units: 3, doctor: "Dr. Ssekibala", status: "PENDING", time: "10:15" },
];

export default function BloodBankPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Droplets className="h-6 w-6 text-red-500" /> Blood Bank
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Inventory management and transfusion requests</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-2 transition-colors">
                    <Plus className="h-4 w-4" /> Record Donation
                </button>
            </div>

            {/* Inventory grid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 mb-4">Blood Group Inventory</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {bloodInventory.map((b, i) => {
                        const pct = Math.round((b.available / b.total) * 100);
                        const isLow = b.available < 5;
                        return (
                            <motion.div
                                key={b.group}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className={`p-4 rounded-xl border ${isLow ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl font-black text-gray-900">{b.group}</span>
                                    {isLow
                                        ? <AlertCircle className="h-4 w-4 text-red-500" />
                                        : <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    }
                                </div>
                                <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
                                    <div className={`h-full rounded-full ${isLow ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                                </div>
                                <div className="text-xs text-gray-600">
                                    <span className="font-bold">{b.available}</span> available &bull; {b.reserved} reserved
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Requests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                    <h2 className="font-bold text-gray-900">Transfusion Requests</h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {recentRequests.map((r) => (
                        <div key={r.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                                    <span className="text-sm font-black text-red-600">{r.group}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{r.patient}</p>
                                    <p className="text-xs text-gray-400">{r.units} unit(s) &bull; {r.doctor} &bull; {r.time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${r.status === "FULFILLED" ? "badge-green" : "badge-yellow"}`}>
                                    {r.status}
                                </span>
                                {r.status === "PENDING" && (
                                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                                        Fulfill
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
