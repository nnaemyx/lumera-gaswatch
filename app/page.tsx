"use client";

import { useWallet } from "@/contexts/WalletContext";
import Header from "@/components/Header";
import WalletActivityHeatmap from "@/components/WalletActivityHeatmap";
import { AlertCircle, Calendar, Activity, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { isConnected, error, connect, isLoading } = useWallet();

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0a0e1a] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.10),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      {/* Animated mesh gradient */}
      <div className="fixed inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(59,130,246,0.06)_50%,transparent_70%)] pointer-events-none animate-pulse"></div>
      
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
              <p className="font-semibold text-red-300" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Connection Error</p>
              <p className="text-sm text-red-400/80 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Main Content - Always show Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto"
        >
          <WalletActivityHeatmap />
        </motion.div>

        {/* Info Section */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto mt-12"
          >
            <div className="bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-3xl p-8 border-2 border-blue-500/20 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl mb-6">
                    <Calendar className="text-blue-400" size={20} />
                    <span className="text-blue-300 text-sm font-semibold tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      How It Works
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    Activity Heatmap
                  </h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    Visualize wallet transaction activity with a GitHub-style heatmap calendar. See your transaction patterns and activity intensity over the last 365 days on Lumera Testnet.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { 
                      icon: Calendar, 
                      title: "Calendar View", 
                      desc: "See transaction activity displayed as a calendar heatmap, just like GitHub contributions",
                      bgColor: "bg-blue-500/5",
                      borderColor: "border-blue-500/20",
                      hoverBorder: "hover:border-blue-500/40",
                      iconBg: "bg-blue-500/20",
                      iconBorder: "border-blue-500/30",
                      iconColor: "text-blue-400"
                    },
                    { 
                      icon: Activity, 
                      title: "Activity Intensity", 
                      desc: "Color intensity shows transaction volume - darker colors mean more transactions on that day",
                      bgColor: "bg-indigo-500/5",
                      borderColor: "border-indigo-500/20",
                      hoverBorder: "hover:border-indigo-500/40",
                      iconBg: "bg-indigo-500/20",
                      iconBorder: "border-indigo-500/30",
                      iconColor: "text-indigo-400"
                    },
                    { 
                      icon: TrendingUp, 
                      title: "Analytics Insights", 
                      desc: "View total transactions, active days, average per day, and most active day statistics",
                      bgColor: "bg-purple-500/5",
                      borderColor: "border-purple-500/20",
                      hoverBorder: "hover:border-purple-500/40",
                      iconBg: "bg-purple-500/20",
                      iconBorder: "border-purple-500/30",
                      iconColor: "text-purple-400"
                    },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className={`${feature.bgColor} ${feature.borderColor} ${feature.hoverBorder} rounded-2xl p-6 text-center transition-all duration-300`}
                    >
                      <div className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4 border ${feature.iconBorder}`}>
                        <feature.icon className={feature.iconColor} size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-400">{feature.desc}</p>
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
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 font-semibold text-base shadow-2xl glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    >
                      <Calendar size={20} />
                      <span>{isLoading ? "Connecting..." : "Connect Wallet to View Activity"}</span>
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
