"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Construction, Settings } from "lucide-react";

export function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] flex items-center justify-center p-6 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      <div className="max-w-2xl w-full relative z-10 text-center space-y-12">
        {/* Icon Cluster */}
        <div className="relative inline-block">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 bg-cyan-500/10 rounded-[2.5rem] border border-cyan-500/20 backdrop-blur-xl flex items-center justify-center relative z-10"
          >
            <Construction className="h-16 w-16 text-cyan-400" />
          </motion.div>
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-4 -right-4 w-12 h-12 bg-purple-500/20 rounded-2xl border border-purple-500/30 backdrop-blur-xl flex items-center justify-center z-20"
          >
            <Settings className="h-6 w-6 text-purple-400" />
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-black font-headline tracking-tighter text-white"
          >
            SYSTEM <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">EVOLUTION</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-slate-400 leading-relaxed font-medium"
          >
            BuildbotAI is currently undergoing an architected upgrade. 
            Our synthesis cores are being recalibrated for enhanced performance.
          </motion.p>
        </div>

        {/* Status Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></div>
              <p className="text-sm font-bold uppercase tracking-widest text-cyan-400">System Status: Updating</p>
            </div>
            <div className="h-px w-full md:w-24 bg-white/10"></div>
            <p className="text-sm text-slate-500 font-medium tracking-wide italic">Estimated Downtime: ~30 Minutes</p>
          </div>
          
          {/* Subtle Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 300, ease: "linear" }}
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            ></motion.div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-[0.3em]"
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Secure Maintenance Mode Active
        </motion.div>
      </div>
    </div>
  );
}
