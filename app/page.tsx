"use client";

import React from "react";
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
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white selection:bg-cyan-100 selection:text-cyan-900">
      {/* Navigation */}
      <header className="px-6 lg:px-12 h-24 flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur-xl z-50 border-b border-gray-100/50">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center group cursor-pointer"
        >
          <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl shadow-lg shadow-cyan-600/20 group-hover:rotate-6 transition-transform duration-300">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <span className="ml-4 text-2xl font-black text-gray-900 tracking-tighter">E-HEALTH</span>
        </motion.div>

        <nav className="hidden lg:flex gap-10 items-center">
          {["Dashboard", "Specialists", "Technology", "About"].map((item) => (
            <Link key={item} className="text-sm font-bold text-gray-500 hover:text-cyan-600 transition-colors tracking-tight" href="#">
              {item}
            </Link>
          ))}
          <div className="h-6 w-px bg-gray-200 mx-2" />
          <Link href="/login">
            <Button variant="outline" className="h-12 px-6 border-gray-200">Sign In</Button>
          </Link>
          <Link href="/patient/register">
            <Button className="h-12 px-8">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 px-6 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(8,145,178,0.05),transparent_50%)]" />
          <div className="absolute top-40 right-[-10%] w-[500px] h-[500px] bg-cyan-100/30 blur-[120px] rounded-full -z-10 animate-pulse" />

          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto space-y-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center space-x-2 bg-cyan-50/50 px-5 py-2.5 rounded-full border border-cyan-100 backdrop-blur-sm shadow-sm"
              >
                <Sparkles className="h-4 w-4 text-cyan-600" />
                <span className="text-[11px] font-black text-cyan-700 uppercase tracking-widest">Digital Healthcare Revolution</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl lg:text-8xl font-black text-gray-900 leading-[0.95] tracking-tight"
              >
                Unified Health <br />
                <span className="text-gradient-cyan">Intelligent Care.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto text-gray-600 text-xl font-medium leading-relaxed"
              >
                Experience a seamless healthcare ecosystem built for modern hospitals.
                Managing patients, prescriptions, and records with precision and beauty.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
              >
                <Link href="/login">
                  <Button size="lg" className="h-16 px-12 group">
                    Enter Platform <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center -space-x-3">
                  {[1, 2, 3, 4].map((v) => (
                    <div key={v} className="h-12 w-12 rounded-full border-4 border-white bg-gray-100 overflow-hidden ring-1 ring-cyan-100">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${v + 10}`} alt="User" />
                    </div>
                  ))}
                  <div className="h-12 w-12 rounded-full border-4 border-white bg-cyan-600 flex items-center justify-center text-[10px] font-black text-white ring-1 ring-cyan-100">
                    +2k
                  </div>
                  <span className="ml-6 text-sm font-bold text-gray-500">Trusted by Professionals</span>
                </div>
              </motion.div>
            </div>

            {/* Stats Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-24 relative"
            >
              <div className="bg-glass rounded-[40px] shadow-premium p-10 border border-white/40 max-w-5xl mx-auto relative overflow-hidden group">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: "Active Patients", val: "12,450", icon: Users, color: "bg-cyan-50 text-cyan-600" },
                    { label: "Med. Specialists", val: "480", icon: Stethoscope, color: "bg-teal-50 text-teal-600" },
                    { label: "Diagnostics", val: "94k+", icon: Activity, color: "bg-blue-50 text-blue-600" },
                    { label: "Smart Pharmacy", val: "320+", icon: Pill, color: "bg-emerald-50 text-emerald-600" },
                  ].map((stat, i) => (
                    <div key={stat.label} className="group/item relative">
                      <div className={`${stat.color} h-14 w-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover/item:scale-110`}>
                        <stat.icon className="h-7 w-7" />
                      </div>
                      <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.val}</p>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {/* Floating Elements Mockup */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-200/20 blur-3xl rounded-full" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Roles Section */}
        <section className="py-32 bg-gray-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-end justify-between mb-20 gap-8">
              <div className="max-w-xl space-y-4">
                <h2 className="text-5xl font-black tracking-tight leading-tight">Portals Designed for <span className="text-cyan-600">Performance.</span></h2>
                <p className="text-gray-500 text-lg font-medium">Every actor in the system has a dedicated, optimized workspace to maximize clinical efficiency.</p>
              </div>
              <Link href="/login">
                <Button variant="secondary" className="px-10">Explore All Roles</Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { name: "Administrators", icon: ShieldCheck, desc: "Governance, staff verification, and operational health monitoring.", href: "/admin/register", tag: "Management" },
                { name: "Doctors", icon: Stethoscope, desc: "Intelligent prescription engine and real-time patient queue control.", href: "/doctor/register", tag: "Clinical" },
                { name: "Patients", icon: HeartPulse, desc: "Personal health records hub with instant diagnostic report access.", href: "/patient/register", tag: "Personal" },
                { name: "Pharmacies", icon: Pill, desc: "Real-time verification and fulfillment link between doctors and patients.", href: "/pharmacy/register", tag: "Provision" },
              ].map((role, i) => (
                <Link
                  key={role.name}
                  href={role.href}
                  className="group relative p-10 rounded-[40px] bg-white border border-gray-100 hover:border-cyan-200 hover:shadow-premium transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                    <role.icon size={120} />
                  </div>
                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-cyan-50 text-cyan-600 text-[9px] font-black uppercase tracking-widest mb-6">
                      {role.tag}
                    </span>
                    <h3 className="text-2xl font-black mb-4 flex items-center group-hover:text-cyan-600 transition-colors">
                      {role.name}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
                      {role.desc}
                    </p>
                    <div className="flex items-center text-xs font-black uppercase tracking-widest text-cyan-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                      Access Port <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Real-time Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto rounded-[60px] bg-gray-900 p-12 lg:p-24 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
            <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
              <div className="space-y-8">
                <h2 className="text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">Connected <span className="text-cyan-400">Healthcare</span> in Real-Time.</h2>
                <div className="space-y-6">
                  {[
                    { icon: Clock, title: "Zero Latency Queues", desc: "No more long waits. Real-time patient flow across the entire platform." },
                    { icon: CheckCircle2, title: "Verified Professionals", desc: "Strict administrative verification for every doctor and pharmacy outlet." },
                    { icon: Sparkles, title: "Automated Billing", desc: "Integrated medical concessions and automated pharmacy quotes." },
                  ].map((feat) => (
                    <div key={feat.title} className="flex gap-5">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                        <feat.icon size={20} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">{feat.title}</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button size="lg" className="bg-white text-gray-900 hover:bg-cyan-50 border-none px-12 mt-6">
                  Partner With Us
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-[80px] opacity-20 rounded-full animate-pulse" />
                <div className="bg-gray-800 p-8 rounded-[40px] border border-gray-700 shadow-2xl relative">
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-cyan-500/20" />
                          <div>
                            <div className="h-3 w-20 bg-gray-700 rounded-full mb-2" />
                            <div className="h-2 w-12 bg-gray-800 rounded-full" />
                          </div>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${i === 1 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-gray-700'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 px-6 border-t border-gray-100 bg-white relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="flex items-center group cursor-pointer">
              <div className="p-2 bg-gray-900 rounded-xl">
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-black text-gray-900 tracking-tighter">E-HEALTH</span>
            </div>
            <p className="max-w-sm text-gray-500 font-medium leading-relaxed">
              Advancing the standard of digital medical operations through intuitive,
              secure, and highly interactive enterprise technology.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Platform</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-500">
              <li><Link href="/login" className="hover:text-cyan-600 transition-colors">SignIn</Link></li>
              <li><Link href="/patient/register" className="hover:text-cyan-600 transition-colors">Registration</Link></li>
              <li><Link href="#" className="hover:text-cyan-600 transition-colors">Security</Link></li>
              <li><Link href="#" className="hover:text-cyan-600 transition-colors">Support</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Company</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-500">
              <li><Link href="#" className="hover:text-cyan-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-cyan-600 transition-colors">Cookie Choice</Link></li>
              <li><Link href="#" className="hover:text-cyan-600 transition-colors">Medical Legal</Link></li>
              <li><Link href="#" className="hover:text-cyan-600 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">© 2026 E-Health Enterprise. All rights reserved.</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <span>Uganda</span>
            <span>US West</span>
            <span>Status: Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
