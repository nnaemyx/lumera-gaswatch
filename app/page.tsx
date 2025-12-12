"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import Header from "@/components/Header";
import BalanceCard from "@/components/BalanceCard";
import QuickActions from "@/components/QuickActions";
import NetworkInfo from "@/components/NetworkInfo";
import Features from "@/components/Features";
import TransferModal from "@/components/TransferModal";
import StakingModal from "@/components/StakingModal";
import HistoryModal from "@/components/HistoryModal";
import AnalyticsModal from "@/components/AnalyticsModal";
import { AlertCircle, Sparkles, Zap, ArrowRight, Shield, TrendingUp, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { isConnected, error } = useWallet();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.12),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(6,182,212,0.08),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.06),transparent_50%)] pointer-events-none" />
      {/* Animated mesh gradient */}
      <div className="fixed inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(14,165,233,0.05)_50%,transparent_70%)] pointer-events-none animate-pulse"></div>
      
      <Header />

      <main className="container mx-auto px-4 py-10 relative z-10">
        {/* ERROR ALERT */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-950/50 border-2 border-red-500/30 rounded-2xl flex items-start gap-3 shadow-lg backdrop-blur-sm"
          >
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={22} />
            <div>
              <p className="font-semibold text-red-300">Connection Error</p>
              <p className="text-sm text-red-400/80 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* HERO SECTION - PRISM DESIGN */}
            <div className="mb-20 mt-12">
              <div className="max-w-6xl mx-auto">
                {/* Full-width Hero with Split Layout */}
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                  {/* Left Content */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/30 rounded-full">
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
                      <span className="text-sky-300 text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        Advanced DeFi Interface
                      </span>
                    </div>

                    <h1 
                      className="text-5xl md:text-7xl font-extrabold text-white leading-tight"
                      style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                      <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Prism
                      </span>
                      <br />
                      <span className="text-white">DeFi</span>
                      <br />
                      <span className="bg-gradient-to-r from-blue-400 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                        Platform
                      </span>
                    </h1>
                    
                    <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
                      Experience the next generation of decentralized finance. Seamlessly manage, stake, and govern your digital assets with precision and power.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white rounded-xl transition-all duration-300 font-bold shadow-xl glow-primary"
                        style={{ fontFamily: 'var(--font-montserrat)' }}
                      >
                        <AlertCircle size={20} />
                        <span>Connect Wallet</span>
                        <ArrowRight size={18} />
                      </motion.button>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Zap className="text-cyan-400" size={16} />
                          <span>Fast</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Shield className="text-sky-400" size={16} />
                          <span>Secure</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Right Visual */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="relative h-[500px] bg-gradient-to-br from-[#111118] to-[#0f0f15] rounded-3xl border-2 border-sky-500/30 p-12 flex items-center justify-center overflow-hidden">
                      {/* Geometric pattern */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `linear-gradient(rgba(14,165,233,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(14,165,233,0.1) 1px, transparent 1px)`,
                          backgroundSize: '30px 30px'
                        }}></div>
                      </div>
                      
                      {/* Central logo with geometric design */}
                      <div className="relative z-10">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                          className="relative"
                        >
                          {/* Outer ring */}
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 w-48 h-48 border-2 border-dashed border-sky-500/40 rounded-full"
                          ></motion.div>
                          
                          {/* Main logo */}
                          <div className="w-40 h-40 bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl glow-primary border-2 border-sky-400/50 relative">
                            <span className="text-white font-black text-7xl" style={{ fontFamily: 'var(--font-montserrat)' }}>P</span>
                            {/* Corner accents */}
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full animate-pulse"></div>
                            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-sky-400 rounded-full animate-pulse delay-300"></div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Floating orbs */}
                      <div className="absolute top-8 left-8 w-3 h-3 bg-sky-400 rounded-full animate-pulse"></div>
                      <div className="absolute top-16 right-12 w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-500"></div>
                      <div className="absolute bottom-16 left-12 w-4 h-4 bg-blue-400 rounded-full animate-pulse delay-700"></div>
                      <div className="absolute bottom-8 right-8 w-2 h-2 bg-sky-400 rounded-full animate-pulse delay-1000"></div>
                    </div>
                  </motion.div>
                </div>

                {/* Stats/Features Row */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {[
                    { icon: Shield, title: "Secure", desc: "Enterprise security", gradient: "from-sky-500 to-cyan-500" },
                    { icon: TrendingUp, title: "Stake", desc: "Maximize rewards", gradient: "from-cyan-500 to-blue-500" },
                    { icon: Globe, title: "Govern", desc: "Shape protocols", gradient: "from-blue-500 to-sky-500" },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="bg-gradient-to-br from-[#111118] to-[#0f0f15] rounded-2xl p-6 border border-sky-500/20 hover:border-sky-400/40 transition-all duration-300 hover:scale-105 group"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                        <feature.icon className="text-white" size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {feature.desc}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* INFO CARDS */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <NetworkInfo />
              <Features />
            </div>

            {/* GETTING STARTED */}
            <div className="bg-gradient-to-br from-[#111118] to-[#0f0f15] rounded-3xl p-10 border-2 border-sky-500/20 shadow-2xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-extrabold text-white mb-8 tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  Getting Started
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {["Install Keplr Wallet browser extension","Click 'Connect Keplr' in the header","Cosmos network will be added automatically","Start managing, staking & transacting tokens"].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-start gap-4 group p-4 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white flex items-center justify-center text-base font-bold shadow-lg glow-primary group-hover:scale-110 transition-transform duration-300 flex-shrink-0" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {i + 1}
                      </span>
                      <span className="leading-relaxed text-base font-normal pt-3 text-gray-300 group-hover:text-white transition-colors">
                        {i === 0 ? (
                          <>
                            Install <a href="https://www.keplr.app/" target="_blank" rel="noopener noreferrer" className="underline text-sky-400 font-semibold hover:text-cyan-400 transition-colors">Keplr Wallet</a> browser extension
                          </>
                        ) : step}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto space-y-8"
          >
            <BalanceCard />

            <QuickActions
              onTransfer={() => setShowTransferModal(true)}
              onStake={() => setShowStakingModal(true)}
              onHistory={() => setShowHistoryModal(true)}
              onAnalytics={() => setShowAnalyticsModal(true)}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <NetworkInfo />
              <Features />
            </div>
          </motion.div>
        )}
      </main>

      {/* MODALS */}
      <TransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
      <StakingModal isOpen={showStakingModal} onClose={() => setShowStakingModal(false)} />
      <HistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />
      <AnalyticsModal isOpen={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} />
    </div>
  );
}
