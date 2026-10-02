"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { BedDouble, RefreshCw, Search, Plus, X } from "lucide-react";

interface Bed {
    id: string;
    number: string;
    ward: string;
    occupied: boolean;
    patientName?: string;
    admittedAt?: any;
}

const WARDS = ["General", "ICU", "Pediatrics", "Maternity", "Surgery", "Orthopedics", "Neurology"];

const WARD_BADGE: Record<string, string> = {
    General: "bg-blue-50 text-blue-700 border-blue-100",
    ICU: "bg-red-50 text-red-700 border-red-100",
    Pediatrics: "bg-green-50 text-green-700 border-green-100",
    Maternity: "bg-pink-50 text-pink-700 border-pink-100",
    Surgery: "bg-purple-50 text-purple-700 border-purple-100",
    Orthopedics: "bg-orange-50 text-orange-700 border-orange-100",
    Neurology: "bg-teal-50 text-teal-700 border-teal-100",
};

export default function IpdBedsPage() {
    const { profile } = useAuth();
    const [beds, setBeds] = useState<Bed[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWard, setSelectedWard] = useState("all");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ward: WARDS[0], number: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => { fetchBeds(); }, []);

    const fetchBeds = async () => {
        setLoading(true);
        try {
            const [bedSnap, admSnap] = await Promise.all([
                getDocs(collection(db, "beds")),
                getDocs(collection(db, "ipdAdmissions")),
            ]);
            const admitted = admSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(a => a.status === "ADMITTED");

            setBeds(bedSnap.docs.map(d => {
                const data = d.data() as any;
                const patient = admitted.find((a: any) => a.bedNumber === data.number);
                return {
                    id: d.id,
                    number: data.number,
                    ward: data.ward,
                    occupied: !!patient,
                    patientName: patient?.patientName,
                    admittedAt: patient?.admittedAt,
                };
            }));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAddBed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.number.trim()) return;
        setSaving(true);
        setError("");
        try {
            await addDoc(collection(db, "beds"), {
                ward: form.ward,
                number: form.number.trim().toUpperCase(),
                createdBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setForm({ ward: WARDS[0], number: "" });
            setShowForm(false);
            await fetchBeds();
        } catch (e: any) {
            console.error(e);
            setError(e?.message || "Failed to add bed. Please try again.");
        }
        finally { setSaving(false); }
    };

    const filtered = beds.filter(b => {
        const matchWard = selectedWard === "all" || b.ward === selectedWard;
        const matchSearch = !search || b.number.toLowerCase().includes(search.toLowerCase()) ||
            (b.patientName?.toLowerCase().includes(search.toLowerCase()));
        return matchWard && matchSearch;
    });

    const available = beds.filter(b => !b.occupied).length;
    const occupied = beds.filter(b => b.occupied).length;

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Bed Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Bed availability across all wards</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchBeds} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)}
                        className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-1.5 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Add Bed
                    </button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleAddBed} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 w-full">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Ward</label>
                            <select value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))}
                                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium outline-none focus:border-blue-500">
                                {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 w-full">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Bed Number</label>
                            <input required placeholder="e.g. GEN-01" value={form.number}
                                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium outline-none focus:border-blue-500" />
                        </div>
                        <button type="submit" disabled={saving}
                            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold shrink-0">
                            {saving ? "Saving…" : "Save"}
                        </button>
                        <button type="button" onClick={() => { setShowForm(false); setError(""); }}
                            className="h-11 w-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    {error && (
                        <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
                    )}
                </form>
            )}

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-3xl font-black text-gray-900">{loading ? "—" : beds.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Total Beds</p>
                </div>
                <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
                    <p className="text-3xl font-black text-green-600">{loading ? "—" : available}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Available</p>
                </div>
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                    <p className="text-3xl font-black text-red-500">{loading ? "—" : occupied}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Occupied</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                <div className="bg-white rounded-xl border border-gray-100 p-1.5 flex gap-1 flex-wrap">
                    {["all", ...WARDS].map(w => (
                        <button key={w} onClick={() => setSelectedWard(w)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedWard === w ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                            {w === "all" ? "All Wards" : w}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input placeholder="Search bed or patient..." value={search} onChange={e => setSearch(e.target.value)}
                        className="h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : beds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <BedDouble className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No beds registered yet</p>
                    <p className="text-xs text-gray-400">Use "Add Bed" above to register each ward's physical beds.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {filtered.map(bed => (
                        <div key={bed.id} className={`rounded-2xl border p-4 transition-all ${
                            bed.occupied
                                ? "bg-red-50 border-red-100"
                                : "bg-green-50 border-green-100"
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <BedDouble className={`h-4 w-4 ${bed.occupied ? "text-red-400" : "text-green-500"}`} />
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                    bed.occupied ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                                }`}>{bed.occupied ? "Occupied" : "Free"}</span>
                            </div>
                            <p className="text-sm font-black text-gray-900">{bed.number}</p>
                            <p className={`text-[10px] mt-0.5 inline-block px-1.5 py-0.5 rounded-md border ${WARD_BADGE[bed.ward] || "bg-gray-50 text-gray-600 border-gray-100"}`}>{bed.ward}</p>
                            {bed.occupied && bed.patientName && (
                                <p className="text-[10px] font-semibold text-red-600 mt-1 truncate">{bed.patientName}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
