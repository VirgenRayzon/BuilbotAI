"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  MessageSquare,
  Globe,
  Twitter,
  Github,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
              <Zap className="w-3.5 h-3.5" />
              Direct Uplink
            </div>

            <h1 className="text-6xl md:text-8xl font-black font-headline uppercase tracking-tighter leading-none italic mb-8">
              Get in <span className="text-primary">Touch</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-lg font-medium leading-relaxed">
              Have a custom request or need technical guidance? Our neural engineers and hardware specialists are standing by to assist with your next masterpiece.
            </p>

            <div className="space-y-8">
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Email Synthesis</p>
                  <p className="text-xl font-bold font-headline uppercase tracking-tight">support@buildbot.ai</p>
                </div>
              </div>

              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Neural Hotline</p>
                  <p className="text-xl font-bold font-headline uppercase tracking-tight">+1 (888) BUILDBOT</p>
                </div>
              </div>

              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Headquarters</p>
                  <p className="text-xl font-bold font-headline uppercase tracking-tight text-balance">Cubao, Quezon City, Philippines</p>
                </div>
              </div>
            </div>

            <div className="mt-16 flex gap-6">
              <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer">
                <Twitter className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer">
                <Github className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer">
                <Globe className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </motion.div>

          {/* Right: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative p-8 md:p-12 rounded-[2.5rem] bg-muted/30 border border-border/50 backdrop-blur-xl"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full bg-background/50 border border-border/50 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="w-full bg-background/50 border border-border/50 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                <select className="w-full bg-background/50 border border-border/50 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none">
                  <option>Hardware Compatibility Inquiry</option>
                  <option>Custom Build Commission</option>
                  <option>Technical Support</option>
                  <option>Business Partnership</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Message Detail</label>
                <textarea
                  rows={5}
                  placeholder="Tell us about your requirements..."
                  className="w-full bg-background/50 border border-border/50 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                />
              </div>

              <Button className="w-full h-16 rounded-xl text-lg font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 group">
                <span className="mr-3">Transmit Message</span>
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
