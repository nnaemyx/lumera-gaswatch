"use client";

import { useState, useEffect } from "react";
import { getNetworkStats, NetworkStats, getValidators } from "@/lib/cosmos-client";
import { 
  Activity, 
  RefreshCw,
  Loader2,
  TrendingUp,
  Clock,
  Zap,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  Gauge
} from "lucide-react";
import { motion } from "framer-motion";

export default function NetworkStatsDashboard() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [validators, setValidators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const networkStats = await getNetworkStats();
      setStats(networkStats);
      setLastUpdate(new Date());
      
      // Load validators
      try {
        const validatorsData = await getValidators();
        setValidators(validatorsData);
      } catch (err) {
        console.error("Error loading validators:", err);
      }
    } catch (err: any) {
      console.error("Error loading network stats:", err);
      setError(err.message || "Failed to load network statistics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    setIsRefreshing(true);
    await loadStats();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(2)}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
      case "degraded":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "down":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="text-emerald-400" size={20} />;
      case "degraded":
        return <AlertCircle className="text-yellow-400" size={20} />;
      case "down":
        return <XCircle className="text-red-400" size={20} />;
      default:
        return <Activity className="text-gray-400" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1a1a2e] to-[#2a2a3e] rounded-3xl p-8 border-2 border-amber-500/20 shadow-2xl backdrop-blur-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl glow-primary border-2 border-amber-400/40">
                <BarChart3 className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
                  Network Stats Dashboard
                </h2>
                <p className="text-sm text-gray-300">
                  Real-time Lumera Testnet network statistics
                </p>
              </div>
            </div>
            <button
              onClick={refreshStats}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 border-2 border-amber-500/30 hover:border-amber-500/50 text-amber-300 rounded-xl transition-all duration-200 font-semibold text-sm hover:bg-amber-500/20 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-manrope)' }}
            >
              <RefreshCw className={isRefreshing ? "animate-spin" : ""} size={18} />
              <span>Refresh</span>
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-950/50 border-2 border-red-500/30 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          {isLoading && !stats && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-amber-400" size={32} />
            </div>
          )}
        </div>
      </motion.div>

      {/* Network Status */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1a1a2e] to-[#2a2a3e] rounded-3xl p-8 border-2 border-amber-500/20 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
              <Activity className="text-amber-400" size={24} />
              Network Status
            </h3>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getStatusColor(stats.networkStatus)}`}>
              {getStatusIcon(stats.networkStatus)}
              <span className="text-sm font-semibold uppercase">{stats.networkStatus}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#0f0f1e] rounded-xl p-6 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="text-amber-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Latest Block Height</span>
              </div>
              <p className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
                {stats.latestHeight.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0f0f1e] rounded-xl p-6 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="text-orange-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Average Block Time</span>
              </div>
              <p className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
                {formatTime(stats.blockTime)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Metrics */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#1a1a2e] to-[#2a2a3e] rounded-3xl p-8 border-2 border-amber-500/20 shadow-2xl backdrop-blur-sm"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
            <Gauge className="text-amber-400" size={24} />
            Performance Metrics
          </h3>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-[#0f0f1e] rounded-xl p-6 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="text-amber-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">TPS</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
                {stats.tps.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">Transactions/sec</p>
            </div>
            <div className="bg-[#0f0f1e] rounded-xl p-6 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="text-orange-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Avg Gas Used</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
                {stats.avgGasUsed.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">Gas units</p>
            </div>
            <div className="bg-[#0f0f1e] rounded-xl p-6 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="text-yellow-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Avg Gas Wanted</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
                {stats.avgGasWanted.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">Gas units</p>
            </div>
            <div className="bg-[#0f0f1e] rounded-xl p-6 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="text-amber-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Total Transactions</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
                {stats.totalTransactions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">Recent blocks</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Validator Status */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#1a1a2e] to-[#2a2a3e] rounded-3xl p-8 border-2 border-amber-500/20 shadow-2xl backdrop-blur-sm"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
            <Users className="text-amber-400" size={24} />
            Validator Status
          </h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#0f0f1e] rounded-xl p-6 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Users className="text-amber-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Total Validators</span>
              </div>
              <p className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
                {stats.totalValidators}
              </p>
            </div>
            <div className="bg-[#0f0f1e] rounded-xl p-6 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-emerald-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Active Validators</span>
              </div>
              <p className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-bebas-neue)', letterSpacing: '0.05em' }}>
                {stats.activeValidators}
              </p>
            </div>
          </div>

          {validators.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {validators.slice(0, 10).map((validator: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-[#0f0f1e] rounded-xl p-4 border border-amber-500/10 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-manrope)' }}>
                          {validator.description?.moniker || validator.moniker || `Validator ${idx + 1}`}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          validator.status === "BOND_STATUS_BONDED" || validator.status === 2
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {validator.status === "BOND_STATUS_BONDED" || validator.status === 2 ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {validator.operator_address && (
                        <p className="text-xs text-gray-400 font-mono" style={{ fontFamily: 'var(--font-roboto-mono)' }}>
                          {validator.operator_address.slice(0, 20)}...
                        </p>
                      )}
                    </div>
                    {validator.tokens && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-400" style={{ fontFamily: 'var(--font-manrope)' }}>
                          {parseFloat(validator.tokens).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">Tokens</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Last Update */}
      {stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-gray-400"
        >
          Last updated: {lastUpdate.toLocaleTimeString()}
        </motion.div>
      )}
    </div>
  );
}
