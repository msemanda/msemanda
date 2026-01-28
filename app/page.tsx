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
  Activity
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Link className="flex items-center justify-center group" href="#">
          <div className="p-2 bg-blue-600 rounded-xl group-hover:rotate-6 transition-transform">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <span className="ml-3 text-xl font-black text-gray-900 tracking-tighter">E-HEALTH</span>
        </Link>
        <nav className="hidden md:flex gap-8 items-center">
          <Link className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors" href="/login">Dashboard</Link>
          <Link className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors" href="#">Services</Link>
          <Link className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors" href="#">About</Link>
          <Link href="/login">
            <Button className="rounded-full px-8 bg-black hover:bg-gray-800">Sign In</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 lg:py-32 px-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50 -z-10 rounded-l-[100px] hidden lg:block" />
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Next-Gen Healthcare Management</span>
              </div>
              <h1 className="text-6xl lg:text-7xl font-black text-gray-900 leading-[0.9] tracking-tighter font-premium">
                Modern Health <br />
                <span className="text-blue-600">Enterprise Solution.</span>
              </h1>
              <p className="max-w-[500px] text-gray-600 text-lg font-medium leading-relaxed">
                Experience a seamless transition into digital healthcare. Managing patients, prescriptions, and medical records has never been this beautiful.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button className="h-16 px-10 rounded-2xl text-lg shadow-xl shadow-blue-200">
                    Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" className="h-16 px-10 rounded-2xl text-lg border-2">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[40px] opacity-10 blur-3xl group-hover:opacity-20 transition-opacity" />
              <div className="bg-white p-8 rounded-[40px] shadow-2xl border relative border-gray-100">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: "Patients", val: "12k+", icon: Users, color: "bg-blue-100 text-blue-600" },
                    { label: "Specialists", val: "450+", icon: Stethoscope, color: "bg-indigo-100 text-indigo-600" },
                    { label: "Prescriptions", val: "89k+", icon: Pill, color: "bg-green-100 text-green-600" },
                    { label: "Verified Outlets", val: "320+", icon: Activity, color: "bg-red-100 text-red-600" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-lg transition-all">
                      <div className={`${stat.color} h-12 w-12 rounded-2xl flex items-center justify-center mb-4`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <p className="text-2xl font-black text-gray-900">{stat.val}</p>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">Unified Experience for Everyone.</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">Specific portals designed around the needs of healthcare professionals and patients.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { name: "Administrators", desc: "Full control over hospital operations and staff authentication.", href: "/admin/register" },
                { name: "Doctors", desc: "Intuitive diagnosis entry and real-time patient queue management.", href: "/doctor/register" },
                { name: "Patients", desc: "Easy registration and instant access to medical reports.", href: "/patient/register" },
                { name: "Pharmacies", desc: "Streamlined prescription fulfillment and billing integration.", href: "/pharmacy/register" },
              ].map((role) => (
                <Link key={role.name} href={role.href} className="group p-8 rounded-3xl bg-gray-800 border border-gray-700 hover:bg-gray-800/50 hover:border-blue-500 transition-all">
                  <h3 className="text-xl font-bold mb-4 group-hover:text-blue-400 transition-colors">{role.name}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">{role.desc}</p>
                  <div className="flex items-center text-xs font-black uppercase tracking-widest text-blue-500 group-hover:translate-x-2 transition-transform">
                    Register Port <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t font-premium">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center">
            <div className="p-2 bg-gray-900 rounded-lg">
              <HeartPulse className="h-4 w-4 text-white" />
            </div>
            <span className="ml-3 text-lg font-black tracking-tighter">E-HEALTH</span>
          </div>
          <p className="text-sm text-gray-400 font-medium">© 2026 E-Health Management System. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-bold text-gray-500">
            <Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
