"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, CreditCard, BedDouble, FlaskConical, AlertOctagon,
    Activity, TrendingUp, RefreshCw, Calendar, Stethoscope, X, ArrowUpRight,
} from "lucide-react";
import { BarChart, DonutChart, TrendChart } from "@/components/charts";
import { ExportMenu } from "@/components/ui/ExportMenu";
import type { ReportColumn } from "@/lib/export";

interface Stats {
    totalPatients: number;
    totalUsers: number;
    totalRevenue: number;
    pendingFees: number;
    confirmedFees: number;
    admissions: number;
    appointments: number;
    labOrders: number;
    incidents: number;
    infections: number;
}

const ROLE_LABEL: Record<string, string> = {
    ADMIN: "Admin", DOCTOR: "Doctor", NURSE: "Nurse", RECEPTIONIST: "Receptionist",
    PHARMACY: "Pharmacist", LAB_TECH: "Lab Technician", RADIOLOGY_TECH: "Radiology Tech",
    PHYSIOTHERAPIST: "Physiotherapist", DENTIST: "Dentist", DIETITIAN: "Dietitian",
    EMERGENCY_STAFF: "Emergency Staff", CASHIER: "Cashier", CLEANER: "Cleaner",
    SECURITY: "Security", OPTICIAN: "Optician", OPTICIAN_ASSISTANT: "Optician Assistant",
    PATIENT: "Patient",
};

function fmtUGX(n: number) { return "UGX " + n.toLocaleString("en-UG"); }

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<Stats>({
        totalPatients: 0, totalUsers: 0, totalRevenue: 0, pendingFees: 0,
        confirmedFees: 0, admissions: 0, appointments: 0, labOrders: 0,
        incidents: 0, infections: 0,
    });
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [fees, setFees] = useState<any[]>([]);
    const [admissionsList, setAdmissionsList] = useState<any[]>([]);
    const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
    const [labOrdersList, setLabOrdersList] = useState<any[]>([]);
    const [incidentsList, setIncidentsList] = useState<any[]>([]);
    const [infectionsList, setInfectionsList] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                usersSnap, feesSnap, admSnap, apptSnap,
                labSnap, incSnap, infSnap, txSnap,
            ] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(collection(db, "consultationFees")),
                getDocs(collection(db, "ipdAdmissions")),
                getDocs(collection(db, "appointments")),
                getDocs(collection(db, "labOrders")),
                getDocs(collection(db, "incidents")),
                getDocs(collection(db, "infectionIncidents")),
                getDocs(collection(db, "transactions")),
            ]);

            const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            const feesData = feesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            const admData = admSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            const apptData = apptSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            const labData = labSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            const incData = incSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            const infData = infSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            const txList = txSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

            const revenue = txList.filter(t => t.type === "income" || t.type === "INCOME").reduce((s, t) => s + (t.amount || 0), 0);
            const feeRevenue = feesData.filter(f => f.status === "PAID").reduce((s, f) => s + (f.amount || 0), 0);

            setStats({
                totalUsers: usersData.length,
                totalPatients: usersData.filter(u => u.role === "PATIENT").length,
                totalRevenue: revenue + feeRevenue,
                pendingFees: feesData.filter(f => f.status === "PENDING" || f.status === "PATIENT_PAID").length,
                confirmedFees: feesData.filter(f => f.status === "PAID").length,
                admissions: admData.filter(d => d.status === "ADMITTED").length,
                appointments: apptData.length,
                labOrders: labData.length,
                incidents: incData.length,
                infections: infData.filter(d => d.status === "active").length,
            });

            setUsers(usersData);
            setFees(feesData);
            setAdmissionsList(admData.filter(d => d.status === "ADMITTED"));
            setAppointmentsList(apptData);
            setLabOrdersList(labData);
            setIncidentsList(incData);
            setInfectionsList(infData.filter(d => d.status === "active"));
            setAllTransactions(txList);
            setTransactions(txList.slice(0, 8));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // ── Derived breakdowns for drill-downs ────────────────────────────────────
    const roleBreakdown = useMemo(() => {
        const map: Record<string, number> = {};
        users.forEach(u => { const r = u.role || "UNKNOWN"; map[r] = (map[r] || 0) + 1; });
        return Object.entries(map).map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count);
    }, [users]);

    const revenueTrend = useMemo(() => {
        const map: Record<string, { income: number; expenses: number }> = {};
        allTransactions.forEach(t => {
            const d = toDate(t.date);
            const key = d ? format(d, "MMM yyyy") : "Unknown";
            if (!map[key]) map[key] = { income: 0, expenses: 0 };
            if (t.type === "income" || t.type === "INCOME") map[key].income += t.amount || 0;
            else map[key].expenses += t.amount || 0;
        });
        return Object.entries(map).map(([month, v]) => ({ month, ...v }));
    }, [allTransactions]);

    const appointmentsTrend = useMemo(() => {
        const map: Record<string, number> = {};
        appointmentsList.forEach(a => {
            const d = a.date ? new Date(a.date) : null;
            const key = d && !isNaN(d.getTime()) ? format(d, "MMM yyyy") : "Unknown";
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([month, count]) => ({ month, count }));
    }, [appointmentsList]);

    const labByStatus = useMemo(() => {
        const map: Record<string, number> = {};
        labOrdersList.forEach(l => { const s = l.status || "PENDING"; map[s] = (map[s] || 0) + 1; });
        return Object.entries(map).map(([status, count]) => ({ status, count }));
    }, [labOrdersList]);

    const incidentsByStatus = useMemo(() => {
        const map: Record<string, number> = {};
        incidentsList.forEach(i => { const s = i.status || "open"; map[s] = (map[s] || 0) + 1; });
        return Object.entries(map).map(([status, count]) => ({ status, count }));
    }, [incidentsList]);

    const pendingFeesList = useMemo(
        () => fees.filter(f => f.status === "PENDING" || f.status === "PATIENT_PAID"),
        [fees]
    );

    const patientsList = useMemo(() => users.filter(u => u.role === "PATIENT"), [users]);

    // ── Metric drill-down definitions ─────────────────────────────────────────
    const metricDetails: Record<string, { title: string; subtitle: string; chart: React.ReactNode; columns: ReportColumn[]; rows: Record<string, string | number>[] }> = {
        totalUsers: {
            title: "Total Users",
            subtitle: "Breakdown by role",
            chart: <DonutChart data={roleBreakdown.map(r => ({ label: ROLE_LABEL[r.role] || r.role, value: r.count }))} />,
            columns: [{ key: "role", label: "Role" }, { key: "count", label: "Count" }],
            rows: roleBreakdown.map(r => ({ role: ROLE_LABEL[r.role] || r.role, count: r.count })),
        },
        totalPatients: {
            title: "Registered Patients",
            subtitle: `${patientsList.length} patients registered`,
            chart: <BarChart data={[{ label: "Registered Patients", value: patientsList.length, color: "#4f46e5" }]} />,
            columns: [{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }],
            rows: patientsList.map(p => ({ name: p.name || "—", email: p.email || "—", phone: p.phone || "—" })),
        },
        admissions: {
            title: "Current Inpatients",
            subtitle: `${admissionsList.length} patients currently admitted`,
            chart: <BarChart data={[{ label: "Currently Admitted", value: admissionsList.length, color: "#0d9488" }]} />,
            columns: [
                { key: "patientName", label: "Patient" }, { key: "ward", label: "Ward" },
                { key: "bedNumber", label: "Bed" }, { key: "doctorName", label: "Doctor" }, { key: "diagnosis", label: "Diagnosis" },
            ],
            rows: admissionsList.map(a => ({
                patientName: a.patientName || "—", ward: a.ward || "—", bedNumber: a.bedNumber || "—",
                doctorName: a.doctorName || "—", diagnosis: a.diagnosis || "—",
            })),
        },
        appointments: {
            title: "Total Appointments",
            subtitle: "Appointments booked per month",
            chart: <TrendChart
                categories={appointmentsTrend.map(a => a.month)}
                series={[{ label: "Appointments", values: appointmentsTrend.map(a => a.count), color: "#9333ea" }]}
            />,
            columns: [{ key: "month", label: "Month" }, { key: "count", label: "Appointments" }],
            rows: appointmentsTrend.map(a => ({ month: a.month, count: a.count })),
        },
        labOrders: {
            title: "Lab Orders",
            subtitle: "Breakdown by status",
            chart: <DonutChart data={labByStatus.map(l => ({ label: l.status, value: l.count }))} />,
            columns: [{ key: "status", label: "Status" }, { key: "count", label: "Count" }],
            rows: labByStatus.map(l => ({ status: l.status, count: l.count })),
        },
        totalRevenue: {
            title: "Total Revenue",
            subtitle: "Income vs expenses by month",
            chart: <TrendChart
                categories={revenueTrend.map(r => r.month)}
                series={[
                    { label: "Income", values: revenueTrend.map(r => r.income), color: "#16a34a" },
                    { label: "Expenses", values: revenueTrend.map(r => r.expenses), color: "#ef4444" },
                ]}
                formatValue={fmtUGX}
            />,
            columns: [{ key: "month", label: "Month" }, { key: "income", label: "Income (UGX)" }, { key: "expenses", label: "Expenses (UGX)" }],
            rows: revenueTrend.map(r => ({ month: r.month, income: r.income, expenses: r.expenses })),
        },
        pendingFees: {
            title: "Pending Payments",
            subtitle: `${pendingFeesList.length} fee records awaiting confirmation`,
            chart: <BarChart data={[{ label: "Pending Payments", value: pendingFeesList.length, color: "#f59e0b" }]} />,
            columns: [
                { key: "patientName", label: "Patient" }, { key: "consultationType", label: "Type" },
                { key: "amount", label: "Amount (UGX)" }, { key: "status", label: "Status" },
            ],
            rows: pendingFeesList.map(f => ({
                patientName: f.patientName || "—", consultationType: f.consultationType || "—",
                amount: f.amount || 0, status: f.status || "—",
            })),
        },
        infections: {
            title: "Active Infections",
            subtitle: `${infectionsList.length} active infection reports`,
            chart: <BarChart data={[{ label: "Active Infections", value: infectionsList.length, color: "#ef4444" }]} />,
            columns: [
                { key: "pathogen", label: "Pathogen" }, { key: "ward", label: "Ward" },
                { key: "casesCount", label: "Cases" }, { key: "reportedBy", label: "Reported By" },
            ],
            rows: infectionsList.map(i => ({
                pathogen: i.pathogen || "—", ward: i.ward || "—", casesCount: i.casesCount || 0, reportedBy: i.reportedBy || "—",
            })),
        },
        incidents: {
            title: "Incidents Reported",
            subtitle: "Breakdown by status",
            chart: <DonutChart data={incidentsByStatus.map(i => ({ label: i.status, value: i.count }))} />,
            columns: [{ key: "status", label: "Status" }, { key: "count", label: "Count" }],
            rows: incidentsByStatus.map(i => ({ status: i.status, count: i.count })),
        },
    };

    const cards = [
        { key: "totalUsers", label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
        { key: "totalPatients", label: "Registered Patients", value: stats.totalPatients, icon: Stethoscope, color: "bg-indigo-50 text-indigo-600", border: "border-indigo-100" },
        { key: "admissions", label: "Current Inpatients", value: stats.admissions, icon: BedDouble, color: "bg-teal-50 text-teal-600", border: "border-teal-100" },
        { key: "appointments", label: "Total Appointments", value: stats.appointments, icon: Calendar, color: "bg-purple-50 text-purple-600", border: "border-purple-100" },
        { key: "labOrders", label: "Lab Orders", value: stats.labOrders, icon: FlaskConical, color: "bg-cyan-50 text-cyan-600", border: "border-cyan-100" },
        { key: "totalRevenue", label: "Total Revenue (UGX)", value: stats.totalRevenue.toLocaleString(), icon: TrendingUp, color: "bg-green-50 text-green-600", border: "border-green-100" },
        { key: "pendingFees", label: "Pending Payments", value: stats.pendingFees, icon: CreditCard, color: "bg-amber-50 text-amber-600", border: "border-amber-100" },
        { key: "infections", label: "Active Infections", value: stats.infections, icon: Activity, color: "bg-red-50 text-red-500", border: "border-red-100" },
        { key: "incidents", label: "Incidents Reported", value: stats.incidents, icon: AlertOctagon, color: "bg-orange-50 text-orange-500", border: "border-orange-100" },
    ];

    const overviewReport = {
        title: "MIS Overview Summary",
        subtitle: `Generated ${new Date().toLocaleDateString()}`,
        columns: [{ key: "metric", label: "Metric" }, { key: "value", label: "Value" }] as ReportColumn[],
        rows: cards.map(c => ({ metric: c.label, value: c.value })),
    };

    const detail = selectedMetric ? metricDetails[selectedMetric] : null;

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Analytics & MIS Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Hospital-wide management information and key metrics — click any card for a detailed report</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <ExportMenu data={overviewReport} />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                        <motion.button
                            key={c.label}
                            type="button"
                            onClick={() => setSelectedMetric(c.key)}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className={`text-left bg-white rounded-2xl border ${c.border} shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`h-9 w-9 rounded-xl ${c.color} flex items-center justify-center`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </div>
                            <p className="text-xl font-black text-gray-900">{loading ? "—" : c.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">{c.label}</p>
                        </motion.button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-black text-gray-900">Fee Payment Summary</p>
                    </div>
                    <div className="p-5">
                        <BarChart
                            data={[
                                { label: "Confirmed Payments", value: stats.confirmedFees, color: "#16a34a" },
                                { label: "Pending / Unconfirmed", value: stats.pendingFees, color: "#f59e0b" },
                            ]}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50">
                        <p className="text-sm font-black text-gray-900">Recent Transactions</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full" /></div>
                    ) : transactions.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-14">No transactions yet</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {transactions.map(tx => (
                                <div key={tx.id} className="px-5 py-3 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 truncate max-w-[180px]">{tx.description}</p>
                                        <p className="text-[10px] text-gray-400">{tx.category}</p>
                                    </div>
                                    <p className={`text-xs font-black ${(tx.type === "income" || tx.type === "INCOME") ? "text-green-600" : "text-red-500"}`}>
                                        {(tx.type === "income" || tx.type === "INCOME") ? "+" : "-"}UGX {(tx.amount || 0).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-black text-gray-900">Revenue Trend</p>
                </div>
                <div className="p-5">
                    <TrendChart
                        categories={revenueTrend.map(r => r.month)}
                        series={[
                            { label: "Income", values: revenueTrend.map(r => r.income), color: "#16a34a" },
                            { label: "Expenses", values: revenueTrend.map(r => r.expenses), color: "#ef4444" },
                        ]}
                        formatValue={fmtUGX}
                    />
                </div>
            </div>

            {/* Drill-down modal */}
            <AnimatePresence>
                {detail && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
                        onClick={() => setSelectedMetric(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                        >
                            <div className="px-6 py-5 border-b border-gray-50 flex items-start justify-between sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">{detail.title}</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">{detail.subtitle}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ExportMenu data={{ title: detail.title, subtitle: detail.subtitle, columns: detail.columns, rows: detail.rows }} />
                                    <button onClick={() => setSelectedMetric(null)}
                                        className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 shrink-0">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>{detail.chart}</div>

                                <div className="overflow-x-auto rounded-xl border border-gray-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {detail.columns.map(c => (
                                                    <th key={c.key} className="px-3 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{c.label}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {detail.rows.length === 0 ? (
                                                <tr><td colSpan={detail.columns.length} className="text-center text-xs text-gray-400 py-8">No data</td></tr>
                                            ) : detail.rows.map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50/50">
                                                    {detail.columns.map(c => (
                                                        <td key={c.key} className="px-3 py-2.5 text-xs text-gray-700 font-medium">{row[c.key]}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
