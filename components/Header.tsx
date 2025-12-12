"use client";

import { useWallet } from "@/contexts/WalletContext";
import { Wallet, LogOut } from "lucide-react";

export default function Header() {
  const { address, isConnected, connect, disconnect, isLoading } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1e1e2e] bg-[#0a0a0f]/80 backdrop-blur-xl shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg glow-primary border-2 border-sky-400/40">
            <span className="text-white font-extrabold text-xl" style={{ fontFamily: 'var(--font-montserrat)' }}>P</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Prism
            </h1>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Staking & Governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-sky-500/10 border-2 border-sky-400/40 rounded-xl backdrop-blur-md shadow-lg">
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse shadow-sm glow-primary"></div>
                <span className="text-sm font-mono text-sky-300 font-semibold">
                  {formatAddress(address!)}
                </span>
              </div>
              <button
                onClick={disconnect}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all duration-200 font-semibold text-sm shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </>
          ) : (
            <button
              onClick={connect}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white rounded-xl transition-all duration-200 font-bold text-sm shadow-lg glow-primary hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-sky-400/40"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              <Wallet size={18} />
              {isLoading ? "Connecting..." : "Connect Keplr"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

