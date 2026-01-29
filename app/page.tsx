"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Pill,
  Users,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  MousePointer2
} from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-mesh selection:bg-cyan-200 selection:text-cyan-900 overflow-x-hidden">
      {/* Interactive Mouse Glow */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-30 opacity-40 mix-blend-soft-light"
        animate={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(8, 145, 178, 0.15), transparent 80%)`,
        }}
      />

      {/* Floating Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="mesh-blob w-[600px] h-[600px] bg-cyan-200/20 top-[-10%] left-[-10%]"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 100, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="mesh-blob w-[500px] h-[500px] bg-teal-200/20 bottom-[-10%] right-[-5%]"
        />
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="mesh-blob w-[400px] h-[400px] bg-blue-200/20 top-[40%] right-[10%]"
        />
      </div>

      {/* Navigation */}
      <header className="px-6 lg:px-12 h-24 flex items-center justify-between sticky top-0 bg-white/40 backdrop-blur-xl z-50 border-b border-white/20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          className="flex items-center group cursor-pointer"
        >
          <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl shadow-premium group-hover:rotate-12 transition-transform duration-500">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <span className="ml-4 text-2xl font-black text-gray-900 tracking-tighter uppercase italic">E-HEALTH</span>
        </motion.div>

        <nav className="hidden lg:flex gap-10 items-center">
          {["Ecosystem", "Intelligence", "Security", "Portal"].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link className="text-[11px] font-black text-gray-400 hover:text-cyan-600 transition-colors uppercase tracking-[0.2em]" href="#">
                {item}
              </Link>
            </motion.div>
          ))}
          <div className="h-6 w-px bg-gray-200/50 mx-2" />
          <Link href="/login">
            <Button variant="ghost" className="h-12 px-6 font-black text-[11px] uppercase tracking-widest text-gray-600 hover:bg-white/50">Sign In</Button>
          </Link>
          <Link href="/patient/register">
            <Button className="h-12 px-8 rounded-2xl shadow-premium bg-cyan-600 hover:bg-cyan-700 transition-all font-black text-[11px] uppercase tracking-widest">Enroll Now</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <motion.section
          style={{ scale, opacity }}
          className="relative pt-20 pb-32 lg:pt-40 lg:pb-56 px-6"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-5xl mx-auto space-y-12 relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, rotate: 1 }}
                className="inline-flex items-center space-x-3 bg-white/60 px-6 py-3 rounded-full border border-white backdrop-blur-md shadow-premium cursor-default"
              >
                <div className="flex -space-x-1">
                  {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />)}
                </div>
                <span className="text-[10px] font-black text-cyan-700 uppercase tracking-[0.3em]">Quantum Medical Ledger Active</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="text-7xl lg:text-[10rem] font-black text-slate-900 leading-[0.8] tracking-tighter"
              >
                Future of <br />
                <span className="text-gradient-cyan italic">Care.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto text-slate-500/80 text-xl md:text-2xl font-medium leading-relaxed"
              >
                Orchestrate your entire medical workspace with an intelligent ecosystem
                designed for precision, speed, and total connectivity.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8"
              >
                <Link href="/login">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="h-20 px-16 rounded-[32px] bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-900/20 group relative overflow-hidden">
                      <span className="relative z-10 font-black text-lg">Enter the Portal</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        transition={{ duration: 0.5 }}
                      />
                      <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-2 transition-transform relative z-10" />
                    </Button>
                  </motion.div>
                </Link>
                <div className="flex flex-col items-center sm:items-start gap-4">
                  <div className="flex items-center -space-x-4">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <motion.div
                        key={v}
                        whileHover={{ y: -10, zIndex: 10 }}
                        className="h-14 w-14 rounded-2xl border-4 border-white bg-slate-100 overflow-hidden shadow-xl"
                      >
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=med-${v + 50}`} alt="User" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" /> +4,200 Medical Nodes Online
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Dynamic Display Section - Replacing Whiteness */}
        <section className="py-20 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="lg:col-span-5 space-y-8"
              >
                <div className="h-px w-20 bg-cyan-500" />
                <h2 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">
                  Real-time <br />Intelligence <br />at your <span className="text-cyan-600 uppercase">Fingertips.</span>
                </h2>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                  Our neural-inspired interface captures every pulse of your medical facility.
                  From emergency registrations to pharmaceutical fulfillments, everything is synced.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-6">
                  <div className="p-6 rounded-3xl bg-white/50 border border-white shadow-premium">
                    <p className="text-3xl font-black text-slate-900">0.4s</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Sync Latency</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/50 border border-white shadow-premium">
                    <p className="text-3xl font-black text-slate-900">100%</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Audit Trail</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="lg:col-span-7"
              >
                <div className="bg-glass-dark rounded-[60px] p-12 shadow-[0_50px_100px_-20px_rgba(15,23,42,0.5)] border border-slate-700/50 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/30" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
                      </div>
                      <div className="px-4 py-1.5 rounded-full bg-slate-800 text-cyan-400 text-[9px] font-black tracking-widest border border-slate-700 uppercase">
                        Master Dashboard Preview
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="h-32 rounded-3xl bg-slate-800/50 border border-slate-700 p-6">
                        <div className="w-10 h-1 bg-cyan-500 rounded-full mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                        <div className="space-y-3">
                          <div className="w-[80%] h-2 bg-slate-700 rounded-full" />
                          <div className="w-[50%] h-2 bg-slate-700 rounded-full" />
                        </div>
                      </div>
                      <div className="h-32 rounded-3xl bg-slate-800/50 border border-slate-700 p-6">
                        <Activity className="text-teal-400 h-6 w-6 mb-4 animate-pulse" />
                        <div className="space-y-3">
                          <div className="w-[70%] h-2 bg-slate-700 rounded-full" />
                          <div className="w-[40%] h-2 bg-slate-700 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="h-48 rounded-[32px] bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8 flex flex-col justify-between group-hover:scale-[1.02] transition-transform duration-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Global Health Metric</p>
                          <p className="text-white text-3xl font-black mt-2 tracking-tight">EXEMPLARY</p>
                        </div>
                        <ShieldCheck className="text-cyan-500 h-10 w-10 opacity-50" />
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "94%" }} className="h-full bg-cyan-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Roles Section - Premium overhaul */}
        <section className="py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-24 space-y-6">
              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="text-6xl font-black tracking-tighter text-slate-900 italic underline decoration-cyan-500/30 decoration-8 underline-offset-8"
              >
                Choose Your <span className="text-gradient-cyan">Access Point.</span>
              </motion.h2>
              <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto">Select a specialized workspace designed specifically for your professional role.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
              {[
                { name: "Administrators", icon: ShieldCheck, desc: "Command & control. Managing staff, verification, and hospital-wide analytics.", href: "/admin/register", color: "from-blue-600 to-indigo-600" },
                { name: "Doctors", icon: Stethoscope, desc: "Clinical excellence. Smart diagnostic ledger and precision prescription tools.", href: "/doctor/register", color: "from-cyan-600 to-teal-600" },
                { name: "Patients", icon: HeartPulse, desc: "Personal care. Direct access to your medical history and diagnostic reports.", href: "/patient/register", color: "from-rose-600 to-pink-600" },
                { name: "Pharmacies", icon: Pill, desc: "Fulfillment node. Verified medical dispensing linked directly to physician orders.", href: "/pharmacy/register", color: "from-emerald-600 to-teal-600" },
              ].map((role, i) => (
                <motion.div
                  key={role.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -15, scale: 1.02 }}
                  className="group"
                >
                  <Link href={role.href} className="flex flex-col h-full rounded-[48px] bg-white border border-white shadow-premium overflow-hidden relative transition-all duration-500 hover:shadow-2xl">
                    <div className={`h-2 bg-gradient-to-r ${role.color} opacity-80`} />
                    <div className="p-12 flex flex-col items-center text-center flex-1">
                      <div className={`p-6 rounded-[32px] bg-slate-50 text-slate-700 group-hover:bg-gradient-to-br ${role.color} group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:rotate-12 group-hover:scale-110`}>
                        <role.icon size={48} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-2xl font-black mt-10 mb-6 text-slate-900 group-hover:text-cyan-600 transition-colors uppercase tracking-tight">{role.name}</h3>
                      <p className="text-slate-400 font-medium text-sm leading-relaxed">
                        {role.desc}
                      </p>
                      <div className="mt-auto pt-10">
                        <div className="h-14 w-14 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-cyan-200 group-hover:text-cyan-600 transition-all group-hover:bg-cyan-50">
                          <ArrowRight className="h-6 w-6" />
                        </div>
                      </div>
                    </div>
                    {/* Role specific background symbol */}
                    <div className="absolute bottom-[-10%] right-[-10%] opacity-[0.02] group-hover:opacity-[0.05] group-hover:scale-150 transition-all duration-700">
                      <role.icon size={200} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Dark & Intense */}
        <section className="py-40 px-6">
          <div className="max-w-7xl mx-auto rounded-[80px] bg-slate-900 p-16 lg:p-32 relative overflow-hidden overflow-x-hidden shadow-[0_80px_150px_-30px_rgba(15,23,42,0.8)]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(8,145,178,0.2),transparent_60%)] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(13,148,136,0.1),transparent_60%)] pointer-events-none" />

            <div className="relative z-10 text-center max-w-4xl mx-auto space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-8"
              >
                <div className="grid grid-cols-3 gap-8">
                  {[Sparkles, ShieldCheck, Activity].map((Icon, i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                      className="h-16 w-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400"
                    >
                      <Icon size={28} />
                    </motion.div>
                  ))}
                </div>
                <h2 className="text-6xl lg:text-8xl font-black text-white leading-none tracking-tighter uppercase italic">Ready to <br /><span className="text-gradient-cyan">Modernize?</span></h2>
                <p className="text-slate-400 text-xl font-medium max-w-xl">Join hundreds of medical institutions already using E-Health to redefine patient care standards.</p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="h-20 px-16 rounded-[32px] bg-white text-slate-900 hover:bg-cyan-50 font-black text-lg transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]">
                    Create Institution Account
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-slate-200/50 pt-20 mb-20 gap-12">
            <div className="flex items-center group cursor-pointer">
              <div className="p-3 bg-slate-900 rounded-[20px] shadow-lg group-hover:rotate-12 transition-transform duration-500">
                <HeartPulse className="h-6 w-6 text-white" />
              </div>
              <span className="ml-5 text-3xl font-black text-slate-900 tracking-tighter uppercase italic">E-HEALTH</span>
            </div>
            <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              <Link href="#" className="hover:text-cyan-600 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-cyan-600 transition-colors">Security</Link>
              <Link href="#" className="hover:text-cyan-600 transition-colors">Legal</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 items-start">
            <div className="col-span-2 space-y-6">
              <p className="max-w-xs text-slate-500 font-medium leading-relaxed italic">"Transforming healthcare management through quantum-inspired technology and seamless user experiences."</p>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100" />)}
              </div>
            </div>
            {[
              { title: "Platform", links: ["Intelligence", "Diagnostics", "Ecosystem", "API Node"] },
              { title: "User Type", links: ["Admin", "Doctors", "Patients", "Pharmacy"] },
            ].map((col, i) => (
              <div key={i} className="space-y-6 lg:col-start-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{col.title}</h4>
                <ul className="space-y-4 font-bold text-slate-900 text-sm">
                  {col.links.map(l => <li key={l}><Link href="#" className="hover:text-cyan-600 transition-colors">{l}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-32 flex flex-col sm:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 gap-8">
            <p>© 2026 E-Health Enterprise Group • Kampala • SF • Nairobi</p>
            <p className="flex items-center gap-4">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" /> Platform Status: Global Online
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
