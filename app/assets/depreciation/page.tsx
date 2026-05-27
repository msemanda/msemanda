"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingDown, RefreshCw, Search } from "lucide-react";

interface Asset {
    id: string;
    assetNo: string;
    name: string;
    category: string;
    purchaseValue: number;
    purchaseDate: string;
    usefulLifeYears: number;
}

function calcDepreciation(asset: Asset) {
    if (!asset.purchaseDate || !asset.purchaseValue || !asset.usefulLifeYears) return { annualDep: 0, accumulated: 0, bookValue: asset.purchaseValue || 0, yearsElapsed: 0 };
    const purchaseYear = new Date(asset.purchaseDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsElapsed = Math.min(currentYear - purchaseYear, asset.usefulLifeYears);
    const annualDep = asset.purchaseValue / asset.usefulLifeYears;
    const accumulated = annualDep * yearsElapsed;
    const bookValue = Math.max(0, asset.purchaseValue - accumulated);
    return { annualDep, accumulated, bookValue, yearsElapsed };
}

export default function AssetsDepreciationPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => { fetchAssets(); }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "fixedAssets"));
            setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filtered = assets.filter(a =>
        !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
    );

    const totalOriginal = filtered.reduce((s, a) => s + (a.purchaseValue || 0), 0);
    const totalBook = filtered.reduce((s, a) => s + calcDepreciation(a).bookValue, 0);
    const totalDepreciation = totalOriginal - totalBook;

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Depreciation</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Straight-line depreciation calculations for fixed assets</p>
                </div>
                <button onClick={fetchAssets} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {!loading && filtered.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-2xl font-black text-gray-900">UGX {totalOriginal.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">Original Cost</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                        <p className="text-2xl font-black text-red-500">UGX {totalDepreciation.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">Total Depreciated</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
                        <p className="text-2xl font-black text-green-600">UGX {totalBook.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">Current Book Value</p>
                    </div>
                </div>
            )}

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <TrendingDown className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No assets to depreciate</p>
                    <p className="text-xs text-gray-400">Register fixed assets first.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Asset", "Original Cost", "Annual Dep.", "Years", "Accumulated", "Book Value"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(a => {
                                const d = calcDepreciation(a);
                                const pct = a.purchaseValue ? Math.round((d.accumulated / a.purchaseValue) * 100) : 0;
                                return (
                                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-gray-900">{a.name}</p>
                                            <p className="text-xs text-gray-400">{a.category}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-700">UGX {(a.purchaseValue || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">UGX {Math.round(d.annualDep).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{d.yearsElapsed} / {a.usefulLifeYears}y</td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs text-red-500 font-bold">UGX {Math.round(d.accumulated).toLocaleString()}</p>
                                            <div className="h-1 w-20 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }}/>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-black text-green-600">UGX {Math.round(d.bookValue).toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
