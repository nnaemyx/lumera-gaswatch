"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getAllBalances, formatTokenAmount } from "@/lib/cosmos-client";
import { 
  Plus, 
  X, 
  Wallet, 
  Copy,
  CheckCircle,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrackedWallet {
  address: string;
  name?: string;
  startingBalances: Array<{ denom: string; amount: string }>;
  currentBalances: Array<{ denom: string; amount: string }>;
  startDate: string;
  isLoading: boolean;
  lastUpdated: string;
}

interface ProfitLossData {
  denom: string;
  startingAmount: number;
  currentAmount: number;
  difference: number;
  percentageChange: number;
}

export default function WalletProfitLossTracker() {
  const { address: connectedAddress } = useWallet();
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load tracked wallets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tracked_wallets_pnl");
    if (saved) {
      try {
        const wallets = JSON.parse(saved);
        setTrackedWallets(wallets);
        // Refresh all wallets
        refreshAllWallets(wallets);
      } catch (e) {
        console.error("Error loading tracked wallets:", e);
      }
    }
  }, []);

  // Auto-add connected wallet if not already tracked
  useEffect(() => {
    if (connectedAddress && trackedWallets.length === 0) {
      const isAlreadyTracked = trackedWallets.some(w => w.address === connectedAddress);
      if (!isAlreadyTracked) {
        addWallet(connectedAddress, "My Wallet");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress]);

  const saveToLocalStorage = (wallets: TrackedWallet[]) => {
    localStorage.setItem("tracked_wallets_pnl", JSON.stringify(wallets));
  };

  const fetchCurrentBalances = async (address: string): Promise<Array<{ denom: string; amount: string }>> => {
    try {
      const balances = await getAllBalances(address);
      return balances.map((b) => ({ denom: b.denom, amount: b.amount }));
    } catch (error) {
      console.error(`Error fetching balances for ${address}:`, error);
      return [];
    }
  };

  const refreshAllWallets = async (wallets: TrackedWallet[] = trackedWallets) => {
    setIsRefreshing(true);
    const updated = await Promise.all(
      wallets.map(async (wallet) => {
        const currentBalances = await fetchCurrentBalances(wallet.address);
        return {
          ...wallet,
          currentBalances,
          isLoading: false,
          lastUpdated: new Date().toISOString()
        };
      })
    );
    setTrackedWallets(updated);
    saveToLocalStorage(updated);
    setIsRefreshing(false);
  };

  const refreshWallet = async (index: number) => {
    const wallet = trackedWallets[index];
    setTrackedWallets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isLoading: true };
      return updated;
    });

    const currentBalances = await fetchCurrentBalances(wallet.address);
    const updated = [...trackedWallets];
    updated[index] = {
      ...wallet,
      currentBalances,
      isLoading: false,
      lastUpdated: new Date().toISOString()
    };
    setTrackedWallets(updated);
    saveToLocalStorage(updated);
  };

  const addWallet = async (address: string, name?: string) => {
    if (!address || address.trim() === "") return;
    
    const trimmedAddress = address.trim();
    
    // Check if already exists
    if (trackedWallets.some(w => w.address === trimmedAddress)) {
      alert("This wallet is already being tracked");
      return;
    }

    setIsAdding(true);
    const currentBalances = await fetchCurrentBalances(trimmedAddress);
    
    const newWallet: TrackedWallet = {
      address: trimmedAddress,
      name: name || `Wallet ${trackedWallets.length + 1}`,
      startingBalances: [...currentBalances], // Set current as starting point
      currentBalances: currentBalances,
      startDate: new Date().toISOString(),
      isLoading: false,
      lastUpdated: new Date().toISOString()
    };

    const updated = [...trackedWallets, newWallet];
    setTrackedWallets(updated);
    saveToLocalStorage(updated);
    setNewAddress("");
    setNewName("");
    setIsAdding(false);
  };

  const resetStartingBalance = (index: number) => {
    const wallet = trackedWallets[index];
    const updated = [...trackedWallets];
    updated[index] = {
      ...wallet,
      startingBalances: [...wallet.currentBalances],
      startDate: new Date().toISOString()
    };
    setTrackedWallets(updated);
    saveToLocalStorage(updated);
  };

  const removeWallet = (index: number) => {
    const updated = trackedWallets.filter((_, i) => i !== index);
    setTrackedWallets(updated);
    saveToLocalStorage(updated);
  };

  const handleAddWallet = () => {
    if (newAddress.trim()) {
      addWallet(newAddress.trim(), newName.trim() || undefined);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddWallet();
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
  };

  const formatDenom = (denom: string) => {
    if (denom === "ulume") return "LUME";
    if (denom.startsWith("u")) {
      return denom.slice(1).toUpperCase();
    }
    return denom.toUpperCase();
  };

  const calculateProfitLoss = (wallet: TrackedWallet): ProfitLossData[] => {
    const pnlData: ProfitLossData[] = [];
    const allDenoms = new Set([
      ...wallet.startingBalances.map(b => b.denom),
      ...wallet.currentBalances.map(b => b.denom)
    ]);

    allDenoms.forEach(denom => {
      const starting = wallet.startingBalances.find(b => b.denom === denom);
      const current = wallet.currentBalances.find(b => b.denom === denom);
      
      const startingAmount = starting ? parseFloat(formatTokenAmount(starting.amount, 6)) : 0;
      const currentAmount = current ? parseFloat(formatTokenAmount(current.amount, 6)) : 0;
      const difference = currentAmount - startingAmount;
      const percentageChange = startingAmount > 0 
        ? (difference / startingAmount) * 100 
        : currentAmount > 0 ? 100 : 0;

      pnlData.push({
        denom,
        startingAmount,
        currentAmount,
        difference,
        percentageChange
      });
    });

    return pnlData;
  };

  const getTotalProfitLoss = (wallet: TrackedWallet) => {
    const pnlData = calculateProfitLoss(wallet);
    return pnlData.reduce((sum, data) => sum + data.difference, 0);
  };

  const getTotalPercentageChange = (wallet: TrackedWallet) => {
    const totalStarting = wallet.startingBalances.reduce((sum, b) => {
      return sum + parseFloat(formatTokenAmount(b.amount, 6));
    }, 0);
    const totalCurrent = wallet.currentBalances.reduce((sum, b) => {
      return sum + parseFloat(formatTokenAmount(b.amount, 6));
    }, 0);
    
    if (totalStarting === 0) return totalCurrent > 0 ? 100 : 0;
    return ((totalCurrent - totalStarting) / totalStarting) * 100;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysTracked = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Add Wallet Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#161b22] to-[#1f2937] rounded-3xl p-8 border-2 border-emerald-500/20 shadow-2xl backdrop-blur-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl glow-primary border-2 border-emerald-400/40">
              <BarChart3 className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                Profit & Loss Tracker
              </h2>
              <p className="text-sm text-gray-400">
                Track wallet performance by comparing starting vs current balances
              </p>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter wallet address..."
                className="w-full px-6 py-4 bg-[#0d1117] border-2 border-emerald-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 transition-all duration-200 font-mono text-sm mb-3"
                style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Optional: Wallet name/label"
                className="w-full px-6 py-4 bg-[#0d1117] border-2 border-emerald-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 transition-all duration-200 text-sm"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddWallet}
                disabled={isAdding || !newAddress.trim()}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl transition-all duration-200 font-semibold text-sm shadow-lg glow-primary hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Start Tracking</span>
                  </>
                )}
              </button>
              {connectedAddress && (
                <button
                  onClick={() => {
                    setNewAddress(connectedAddress);
                    setNewName("My Wallet");
                  }}
                  className="px-6 py-4 bg-emerald-500/10 border-2 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 rounded-xl transition-all duration-200 font-semibold text-sm hover:bg-emerald-500/20"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  Use My Wallet
                </button>
              )}
            </div>
          </div>

          {trackedWallets.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-emerald-500/20">
              <p className="text-sm text-gray-400">
                {trackedWallets.length} {trackedWallets.length === 1 ? 'wallet' : 'wallets'} being tracked
              </p>
              <button
                onClick={() => refreshAllWallets()}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 rounded-xl transition-all duration-200 text-sm font-semibold disabled:opacity-50"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                <RefreshCw className={isRefreshing ? "animate-spin" : ""} size={16} />
                <span>Refresh All</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tracked Wallets */}
      <AnimatePresence>
        {trackedWallets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-gradient-to-br from-[#161b22] to-[#1f2937] rounded-3xl p-12 border-2 border-emerald-500/20 text-center"
          >
            <BarChart3 className="text-gray-500 mx-auto mb-4" size={48} />
            <p className="text-gray-400 text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-outfit)' }}>
              No wallets being tracked
            </p>
            <p className="text-gray-500 text-sm">
              Add wallet addresses above to start tracking profit & loss
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {trackedWallets.map((wallet, index) => {
              const totalPL = getTotalProfitLoss(wallet);
              const totalPercentage = getTotalPercentageChange(wallet);
              const pnlData = calculateProfitLoss(wallet);
              const daysTracked = getDaysTracked(wallet.startDate);
              const isProfit = totalPL >= 0;

              return (
                <motion.div
                  key={wallet.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-br from-[#161b22] to-[#1f2937] rounded-3xl p-8 border-2 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-64 h-64 ${isProfit ? 'bg-emerald-500/5' : 'bg-red-500/5'} rounded-full blur-3xl`}></div>
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Wallet className="text-emerald-400" size={24} />
                          <h3 className="text-2xl font-bold text-white truncate" style={{ fontFamily: 'var(--font-outfit)' }}>
                            {wallet.name || `Wallet ${index + 1}`}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-mono text-gray-400 truncate" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
                            {formatAddress(wallet.address)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(wallet.address, index)}
                            className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Copy address"
                          >
                            {copiedIndex === index ? (
                              <CheckCircle className="text-emerald-400" size={16} />
                            ) : (
                              <Copy className="text-gray-400 hover:text-emerald-400" size={16} />
                            )}
                          </button>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar size={14} />
                            <span>Started: {formatDate(wallet.startDate)}</span>
                            <span>•</span>
                            <span>{daysTracked} {daysTracked === 1 ? 'day' : 'days'} ago</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resetStartingBalance(index)}
                          className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 rounded-xl transition-all duration-200 text-xs font-semibold hover:bg-emerald-500/20"
                          style={{ fontFamily: 'var(--font-outfit)' }}
                          title="Reset starting balance to current"
                        >
                          <Target size={14} className="inline mr-1" />
                          Reset Baseline
                        </button>
                        <button
                          onClick={() => removeWallet(index)}
                          className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-gray-400 hover:text-red-400"
                          title="Stop tracking"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Overall P&L Summary */}
                    {wallet.isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-emerald-400" size={32} />
                      </div>
                    ) : (
                      <>
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                          <div className={`bg-[#0d1117] rounded-2xl p-6 border-2 ${isProfit ? 'border-emerald-500/30' : 'border-red-500/30'} ${isProfit ? 'glow-profit' : 'glow-loss'}`}>
                            <div className="flex items-center gap-3 mb-3">
                              {isProfit ? (
                                <TrendingUp className="text-emerald-400" size={24} />
                              ) : (
                                <TrendingDown className="text-red-400" size={24} />
                              )}
                              <span className="text-sm text-gray-400 font-semibold uppercase">Total P&L</span>
                            </div>
                            <p className={`text-3xl font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: 'var(--font-outfit)' }}>
                              {isProfit ? '+' : ''}{totalPL.toFixed(6)}
                            </p>
                            <p className={`text-sm mt-2 ${isProfit ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                              {isProfit ? (
                                <span className="flex items-center gap-1">
                                  <ArrowUpRight size={14} />
                                  {totalPercentage.toFixed(2)}% gain
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <ArrowDownRight size={14} />
                                  {Math.abs(totalPercentage).toFixed(2)}% loss
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="bg-[#0d1117] rounded-2xl p-6 border border-emerald-500/10">
                            <div className="flex items-center gap-3 mb-3">
                              <DollarSign className="text-blue-400" size={20} />
                              <span className="text-sm text-gray-400 font-semibold uppercase">Starting Value</span>
                            </div>
                            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-outfit)' }}>
                              {wallet.startingBalances.reduce((sum, b) => sum + parseFloat(formatTokenAmount(b.amount, 6)), 0).toFixed(6)}
                            </p>
                          </div>

                          <div className="bg-[#0d1117] rounded-2xl p-6 border border-emerald-500/10">
                            <div className="flex items-center gap-3 mb-3">
                              <DollarSign className="text-cyan-400" size={20} />
                              <span className="text-sm text-gray-400 font-semibold uppercase">Current Value</span>
                            </div>
                            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-outfit)' }}>
                              {wallet.currentBalances.reduce((sum, b) => sum + parseFloat(formatTokenAmount(b.amount, 6)), 0).toFixed(6)}
                            </p>
                          </div>
                        </div>

                        {/* Token-by-Token P&L */}
                        <div className="bg-[#0d1117] rounded-2xl p-6 border border-emerald-500/10">
                          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-outfit)' }}>
                            <BarChart3 className="text-emerald-400" size={20} />
                            Token Performance
                          </h4>
                          <div className="space-y-3">
                            {pnlData.length === 0 ? (
                              <p className="text-gray-500 text-center py-4">No balance data available</p>
                            ) : (
                              pnlData.map((data, idx) => {
                                const isTokenProfit = data.difference >= 0;
                                return (
                                  <div
                                    key={idx}
                                    className="bg-[#161b22] rounded-xl p-4 border border-emerald-500/5 hover:border-emerald-500/20 transition-all"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-bold text-white text-lg" style={{ fontFamily: 'var(--font-outfit)' }}>
                                        {formatDenom(data.denom)}
                                      </span>
                                      <span className={`text-sm font-semibold ${isTokenProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isTokenProfit ? '+' : ''}{data.difference.toFixed(6)} ({isTokenProfit ? '+' : ''}{data.percentageChange.toFixed(2)}%)
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-500">Starting: </span>
                                        <span className="text-gray-300 font-medium">{data.startingAmount.toFixed(6)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Current: </span>
                                        <span className="text-white font-semibold">{data.currentAmount.toFixed(6)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Refresh Button */}
                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={() => refreshWallet(index)}
                            disabled={wallet.isLoading}
                            className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 rounded-xl transition-all duration-200 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                            style={{ fontFamily: 'var(--font-outfit)' }}
                          >
                            <RefreshCw className={wallet.isLoading ? "animate-spin" : ""} size={16} />
                            <span>Refresh Balance</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
