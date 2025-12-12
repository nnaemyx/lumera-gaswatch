"use client";

import { useWallet } from "@/contexts/WalletContext";
import { formatTokenAmount } from "@/lib/cosmos-client";
import { Coins, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function BalanceCard() {
  const { balance, refreshBalance, isConnected } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formattedBalance = formatTokenAmount(balance);

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-10 text-white shadow-2xl glow-primary border-2 border-indigo-400/40 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-xl border-2 border-white/30">
              <Coins size={36} className="text-white" />
            </div>
            <div>
              <p className="text-white/90 text-sm font-semibold uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-montserrat)' }}>Total Balance</p>
              <h2 className="text-6xl font-extrabold mt-1 tracking-tight text-white" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {isConnected ? formattedBalance : "0.000000"}
              </h2>
            </div>
          </div>
          {isConnected && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-4 hover:bg-white/20 rounded-2xl transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95 backdrop-blur-md border-2 border-white/30 shadow-lg"
            >
              <RefreshCw
                size={26}
                className={isRefreshing ? "animate-spin text-white" : "text-white"}
              />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-white/30">
          <span className="text-white/90 text-sm font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>LUME</span>
          <span className="text-sm bg-white/20 backdrop-blur-md px-5 py-2 rounded-full font-bold border-2 border-white/30 text-white shadow-lg" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Lumera Mainnet
          </span>
        </div>
      </div>
    </div>
  );
}

