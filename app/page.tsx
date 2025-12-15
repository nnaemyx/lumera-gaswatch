"use client";

import { useWallet } from "@/contexts/WalletContext";
import Header from "@/components/Header";
import GasFeeMonitor from "@/components/GasFeeMonitor";
import { AlertCircle, Zap, TrendingUp, BarChart3, Activity, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { isConnected, error, connect, isLoading } = useWallet();

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.15),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(248,113,113,0.10),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.08),transparent_50%)] pointer-events-none" />
      {/* Animated mesh gradient */}
      <div className="fixed inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(239,68,68,0.06)_50%,transparent_70%)] pointer-events-none animate-pulse"></div>
      
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
              <p className="font-semibold text-red-300" style={{ fontFamily: 'var(--font-montserrat)' }}>Connection Error</p>
              <p className="text-sm text-red-400/80 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Main Content - Always show Gas Fee Monitor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto"
        >
          <GasFeeMonitor />
        </motion.div>

        {/* Info Section */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto mt-12"
          >
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-3xl p-8 border-2 border-red-500/20 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-500/10 border-2 border-red-500/30 rounded-2xl mb-6">
                    <Zap className="text-red-400" size={20} />
                    <span className="text-red-300 text-sm font-semibold tracking-wider" style={{ fontFamily: 'var(--font-montserrat)' }}>
                      How It Works
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    Gas Fee Monitor
                  </h2>
                  <p className="text-gray-300 max-w-2xl mx-auto">
                    Monitor live gas prices on Lumera Testnet. View current gas fees (low, average, high) and track gas price movements over the past 24 hours with interactive charts. Make informed decisions about transaction costs.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { 
                      icon: Zap, 
                      title: "Live Gas Prices", 
                      desc: "View real-time gas prices including low, average, and high fees. Prices are calculated from recent transactions",
                      bgColor: "bg-red-500/5",
                      borderColor: "border-red-500/20",
                      hoverBorder: "hover:border-red-500/40",
                      iconBg: "bg-red-500/20",
                      iconBorder: "border-red-500/30",
                      iconColor: "text-red-400"
                    },
                    { 
                      icon: BarChart3, 
                      title: "24h Price Graph", 
                      desc: "Visualize gas price movements over the past 24 hours with an interactive chart showing trends and patterns",
                      bgColor: "bg-orange-500/5",
                      borderColor: "border-orange-500/20",
                      hoverBorder: "hover:border-orange-500/40",
                      iconBg: "bg-orange-500/20",
                      iconBorder: "border-orange-500/30",
                      iconColor: "text-orange-400"
                    },
                    { 
                      icon: TrendingUp, 
                      title: "Price Statistics", 
                      desc: "See 24-hour minimum, maximum, and average gas prices. Track price changes and trends over time",
                      bgColor: "bg-pink-500/5",
                      borderColor: "border-pink-500/20",
                      hoverBorder: "hover:border-pink-500/40",
                      iconBg: "bg-pink-500/20",
                      iconBorder: "border-pink-500/30",
                      iconColor: "text-pink-400"
                    },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className={`${feature.bgColor} ${feature.borderColor} ${feature.hoverBorder} rounded-2xl p-6 text-center transition-all duration-300`}
                    >
                      <div className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4 border ${feature.iconBorder}`}>
                        <feature.icon className={feature.iconColor} size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-300">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                {!isConnected && (
                  <div className="mt-8 text-center">
                    <motion.button
                      onClick={connect}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl transition-all duration-300 font-semibold text-base shadow-2xl glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                      <Zap size={20} />
                      <span>{isLoading ? "Connecting..." : "Connect Wallet to Monitor"}</span>
                      <ArrowRight size={18} />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
