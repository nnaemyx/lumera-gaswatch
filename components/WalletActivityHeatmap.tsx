"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getTransactionHistory, TransactionDetail } from "@/lib/cosmos-client";
import { 
  Search, 
  Calendar,
  Copy,
  CheckCircle,
  RefreshCw,
  Loader2,
  Activity,
  TrendingUp,
  Zap,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

interface DayActivity {
  date: string;
  count: number;
  transactions: TransactionDetail[];
}

export default function WalletActivityHeatmap() {
  const { address: connectedAddress } = useWallet();
  const [searchAddress, setSearchAddress] = useState("");
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);

  // Set connected address as default when wallet is connected
  useEffect(() => {
    if (connectedAddress && !searchAddress) {
      setSearchAddress(connectedAddress);
      loadActivity(connectedAddress);
    }
  }, [connectedAddress]);

  const loadActivity = async (address: string) => {
    if (!address || address.trim() === "") {
      setError("Please enter a valid address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTransactions([]);
    setSelectedDay(null);

    try {
      const txs = await getTransactionHistory(address.trim());
      setTransactions(txs);
      if (txs.length === 0) {
        setError("No transactions found for this address");
      }
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to fetch transactions. Please check the address and try again.");
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group transactions by date
  const activityByDate = useMemo(() => {
    const activity: Map<string, DayActivity> = new Map();
    
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!activity.has(dateKey)) {
        activity.set(dateKey, {
          date: dateKey,
          count: 0,
          transactions: []
        });
      }
      
      const dayActivity = activity.get(dateKey)!;
      dayActivity.count++;
      dayActivity.transactions.push(tx);
    });

    return activity;
  }, [transactions]);

  // Generate calendar data for the last 365 days
  const calendarData = useMemo(() => {
    const days: Array<{ date: Date; count: number; dateKey: string }> = [];
    const today = new Date();
    
    // Generate last 365 days
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayActivity = activityByDate.get(dateKey);
      days.push({
        date,
        count: dayActivity?.count || 0,
        dateKey
      });
    }

    // Group by weeks (53 weeks for 365 days)
    const weeks: Array<Array<{ date: Date; count: number; dateKey: string }>> = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  }, [activityByDate]);

  // Get intensity color based on count
  const getIntensityColor = (count: number, maxCount: number) => {
    if (count === 0) return "bg-slate-800 border border-slate-700";
    
    const intensity = maxCount > 0 ? count / maxCount : 0;
    
    if (intensity <= 0.2) return "bg-blue-900 border border-blue-800";
    if (intensity <= 0.4) return "bg-blue-800 border border-blue-700";
    if (intensity <= 0.6) return "bg-blue-600 border border-blue-500";
    if (intensity <= 0.8) return "bg-blue-500 border border-blue-400";
    return "bg-blue-400 border border-blue-300";
  };

  const maxCount = useMemo(() => {
    return Math.max(...Array.from(activityByDate.values()).map(a => a.count), 1);
  }, [activityByDate]);

  const totalTransactions = transactions.length;
  const activeDays = activityByDate.size;
  const avgPerDay = activeDays > 0 ? (totalTransactions / activeDays).toFixed(2) : "0";
  const mostActiveDay = Array.from(activityByDate.values()).reduce((max, day) => 
    day.count > max.count ? day : max, 
    { date: "", count: 0, transactions: [] }
  );

  const handleSearch = () => {
    if (searchAddress.trim()) {
      loadActivity(searchAddress.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleDayClick = (dateKey: string) => {
    const dayActivity = activityByDate.get(dateKey);
    if (dayActivity && dayActivity.count > 0) {
      setSelectedDay(dayActivity);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-3xl p-8 border-2 border-blue-500/20 shadow-2xl backdrop-blur-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl glow-primary border-2 border-blue-400/40">
              <Calendar className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Activity Heatmap
              </h2>
              <p className="text-sm text-gray-400">
                GitHub-style calendar showing transaction activity over time
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter wallet address..."
                className="w-full px-6 py-4 bg-[#0a0e1a] border-2 border-blue-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 transition-all duration-200 font-mono text-sm"
                style={{ fontFamily: 'var(--font-source-code-pro)' }}
              />
              {searchAddress && (
                <button
                  onClick={() => copyToClipboard(searchAddress)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <CheckCircle className="text-emerald-400" size={18} />
                  ) : (
                    <Copy className="text-gray-400 hover:text-blue-400" size={18} />
                  )}
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchAddress.trim()}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-semibold text-sm shadow-lg glow-primary hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>View Activity</span>
                </>
              )}
            </button>
            {connectedAddress && (
              <button
                onClick={() => {
                  setSearchAddress(connectedAddress);
                  loadActivity(connectedAddress);
                }}
                className="px-6 py-4 bg-blue-500/10 border-2 border-blue-500/30 hover:border-blue-500/50 text-blue-300 rounded-xl transition-all duration-200 font-semibold text-sm hover:bg-blue-500/20"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Use My Wallet
              </button>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-950/50 border-2 border-red-500/30 rounded-xl flex items-start gap-3"
            >
              <Activity className="text-red-400 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats Section */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-3xl p-8 border-2 border-blue-500/20 shadow-2xl backdrop-blur-sm"
        >
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-[#0a0e1a] rounded-2xl p-6 border border-blue-500/10">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="text-blue-400" size={20} />
                <span className="text-sm text-gray-400 font-semibold uppercase">Total Transactions</span>
              </div>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {totalTransactions}
              </p>
            </div>
            <div className="bg-[#0a0e1a] rounded-2xl p-6 border border-blue-500/10">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="text-indigo-400" size={20} />
                <span className="text-sm text-gray-400 font-semibold uppercase">Active Days</span>
              </div>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {activeDays}
              </p>
            </div>
            <div className="bg-[#0a0e1a] rounded-2xl p-6 border border-blue-500/10">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="text-cyan-400" size={20} />
                <span className="text-sm text-gray-400 font-semibold uppercase">Avg per Day</span>
              </div>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {avgPerDay}
              </p>
            </div>
            <div className="bg-[#0a0e1a] rounded-2xl p-6 border border-blue-500/10">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="text-purple-400" size={20} />
                <span className="text-sm text-gray-400 font-semibold uppercase">Most Active</span>
              </div>
              <p className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {mostActiveDay.count > 0 ? `${mostActiveDay.count} tx` : "N/A"}
              </p>
              {mostActiveDay.count > 0 && (
                <p className="text-xs text-gray-500 mt-1">{formatDate(mostActiveDay.date)}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Heatmap Calendar */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-3xl p-8 border-2 border-blue-500/20 shadow-2xl backdrop-blur-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  Activity Calendar
                </h3>
                <p className="text-sm text-gray-400">Last 365 days of transaction activity</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-slate-800 border border-slate-700 rounded"></div>
                  <div className="w-3 h-3 bg-blue-900 border border-blue-800 rounded"></div>
                  <div className="w-3 h-3 bg-blue-800 border border-blue-700 rounded"></div>
                  <div className="w-3 h-3 bg-blue-600 border border-blue-500 rounded"></div>
                  <div className="w-3 h-3 bg-blue-500 border border-blue-400 rounded"></div>
                  <div className="w-3 h-3 bg-blue-400 border border-blue-300 rounded"></div>
                </div>
                <span className="text-xs text-gray-400">More</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-1 min-w-max">
                {/* Month labels */}
                <div className="flex flex-col gap-1 mr-2">
                  <div className="h-4"></div>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                    <div key={idx} className="h-3 text-xs text-gray-500 font-mono" style={{ fontFamily: 'var(--font-source-code-pro)' }}>
                      {idx % 2 === 0 ? day : ''}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                {calendarData.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {weekIdx === 0 && (
                      <div className="h-4 text-xs text-gray-400 text-center" style={{ fontFamily: 'var(--font-source-code-pro)' }}>
                        {week[0]?.date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    )}
                    {week.map((day, dayIdx) => {
                      const dayActivity = activityByDate.get(day.dateKey);
                      const count = dayActivity?.count || 0;
                      const isToday = day.dateKey === new Date().toISOString().split('T')[0];
                      
                      return (
                        <motion.div
                          key={`${weekIdx}-${dayIdx}`}
                          whileHover={{ scale: 1.1, zIndex: 10 }}
                          className={`w-3 h-3 rounded ${getIntensityColor(count, maxCount)} cursor-pointer transition-all relative group ${
                            isToday ? 'ring-2 ring-blue-400' : ''
                          }`}
                          onClick={() => handleDayClick(day.dateKey)}
                          title={`${formatDate(day.dateKey)}: ${count} ${count === 1 ? 'transaction' : 'transactions'}`}
                        >
                          {count > 0 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                              <div className="bg-[#1e293b] border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap shadow-xl">
                                <div className="font-semibold mb-1">{formatDate(day.dateKey)}</div>
                                <div className="text-blue-300">{count} {count === 1 ? 'transaction' : 'transactions'}</div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                    {/* Show month label every ~4 weeks */}
                    {weekIdx > 0 && weekIdx % 4 === 0 && week[0] && (
                      <div className="h-4 text-xs text-gray-400 text-center mt-1" style={{ fontFamily: 'var(--font-source-code-pro)' }}>
                        {week[0].date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Selected Day Details */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-3xl p-8 border-2 border-blue-500/20 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {formatDate(selectedDay.date)}
              </h3>
              <p className="text-sm text-gray-400">
                {selectedDay.count} {selectedDay.count === 1 ? 'transaction' : 'transactions'} on this day
              </p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-2 hover:bg-blue-500/10 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <CheckCircle size={20} />
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedDay.transactions.map((tx, idx) => (
              <div
                key={idx}
                className="bg-[#0a0e1a] rounded-xl p-4 border border-blue-500/10 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        {tx.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        tx.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                        tx.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {tx.timestamp}
                      </span>
                      {tx.amount && (
                        <span className="text-blue-300 font-semibold">
                          {parseFloat(tx.amount).toFixed(6)} {tx.denom?.toUpperCase() || 'LUME'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
