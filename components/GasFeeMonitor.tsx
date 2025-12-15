"use client";

import { useState, useEffect, useMemo } from "react";
import { getGasFeeStats, GasFeeStats } from "@/lib/cosmos-client";
import { 
  Zap, 
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

export default function GasFeeMonitor() {
  const [stats, setStats] = useState<GasFeeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const gasStats = await getGasFeeStats();
      setStats(gasStats);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error("Error loading gas fee stats:", err);
      setError(err.message || "Failed to load gas fee statistics. Please try again.");
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

  // Prepare graph data (24h history)
  const graphData = useMemo(() => {
    if (!stats || stats.history24h.length === 0) return null;

    const data = stats.history24h;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Filter to last 24 hours and group by hour
    const hourlyData: { [key: number]: number[] } = {};
    
    data.forEach(item => {
      const itemTime = new Date(item.timestamp).getTime();
      if (itemTime >= oneDayAgo) {
        const hour = Math.floor((itemTime - oneDayAgo) / (60 * 60 * 1000));
        if (!hourlyData[hour]) {
          hourlyData[hour] = [];
        }
        hourlyData[hour].push(item.gasPrice);
      }
    });

    // Calculate average for each hour
    const graphPoints = Object.keys(hourlyData)
      .map(Number)
      .sort((a, b) => a - b)
      .map(hour => ({
        hour,
        value: hourlyData[hour].reduce((a, b) => a + b, 0) / hourlyData[hour].length,
      }));

    return graphPoints;
  }, [stats]);

  const formatGasPrice = (price: number) => {
    return price.toFixed(6);
  };

  const getPriceChange = () => {
    if (!stats || stats.history24h.length < 2) return null;
    
    const recent = stats.history24h.slice(-10);
    const older = stats.history24h.slice(-20, -10);
    
    if (recent.length === 0 || older.length === 0) return null;
    
    const recentAvg = recent.reduce((sum, item) => sum + item.gasPrice, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.gasPrice, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    return change;
  };

  const priceChange = getPriceChange();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-3xl p-8 border-2 border-red-500/20 shadow-2xl backdrop-blur-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 via-orange-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl glow-primary border-2 border-red-400/40">
                <Zap className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  Gas Fee Monitor
                </h2>
                <p className="text-sm text-gray-300">
                  Live gas prices and 24-hour price movement
                </p>
              </div>
            </div>
            <button
              onClick={refreshStats}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border-2 border-red-500/30 hover:border-red-500/50 text-red-300 rounded-xl transition-all duration-200 font-semibold text-sm hover:bg-red-500/20 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-montserrat)' }}
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
              <Activity className="text-red-400 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          {isLoading && !stats && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-red-400" size={32} />
            </div>
          )}
        </div>
      </motion.div>

      {/* Current Gas Prices */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-3xl p-8 border-2 border-red-500/20 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-montserrat)' }}>
              <Zap className="text-red-400" size={24} />
              Current Gas Prices
            </h3>
            {priceChange !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                priceChange > 0 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : priceChange < 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {priceChange > 0 ? (
                  <TrendingUp size={16} />
                ) : priceChange < 0 ? (
                  <TrendingDown size={16} />
                ) : (
                  <Minus size={16} />
                )}
                <span className="text-sm font-semibold">
                  {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0a0a0a] rounded-xl p-6 border border-red-500/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="text-emerald-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Low</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {formatGasPrice(stats.current.low)}
              </p>
              <p className="text-xs text-gray-400 font-mono" style={{ fontFamily: 'var(--font-courier-prime)' }}>
                ulume/gas
              </p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-6 border border-red-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="text-orange-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Average</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {formatGasPrice(stats.current.average)}
              </p>
              <p className="text-xs text-gray-400 font-mono" style={{ fontFamily: 'var(--font-courier-prime)' }}>
                ulume/gas
              </p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-6 border border-red-500/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="text-red-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">High</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {formatGasPrice(stats.current.high)}
              </p>
              <p className="text-xs text-gray-400 font-mono" style={{ fontFamily: 'var(--font-courier-prime)' }}>
                ulume/gas
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 24h Statistics */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-3xl p-8 border-2 border-red-500/20 shadow-2xl backdrop-blur-sm"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'var(--font-montserrat)' }}>
            <BarChart3 className="text-red-400" size={24} />
            24-Hour Statistics
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0a0a0a] rounded-xl p-6 border border-red-500/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="text-emerald-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">24h Minimum</span>
              </div>
              <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {formatGasPrice(stats.min24h)}
              </p>
              <p className="text-xs text-gray-400 font-mono" style={{ fontFamily: 'var(--font-courier-prime)' }}>
                ulume/gas
              </p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-6 border border-red-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="text-orange-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">24h Average</span>
              </div>
              <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {formatGasPrice(stats.avg24h)}
              </p>
              <p className="text-xs text-gray-400 font-mono" style={{ fontFamily: 'var(--font-courier-prime)' }}>
                ulume/gas
              </p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-6 border border-red-500/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="text-red-400" size={18} />
                <span className="text-xs text-gray-400 uppercase tracking-wider">24h Maximum</span>
              </div>
              <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {formatGasPrice(stats.max24h)}
              </p>
              <p className="text-xs text-gray-400 font-mono" style={{ fontFamily: 'var(--font-courier-prime)' }}>
                ulume/gas
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 24h Graph */}
      {stats && graphData && graphData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-3xl p-8 border-2 border-red-500/20 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-montserrat)' }}>
              <BarChart3 className="text-red-400" size={24} />
              24-Hour Gas Price Movement
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock size={14} />
              <span>Last 24 hours</span>
            </div>
          </div>

          <div className="bg-[#0a0a0a] rounded-xl p-6 border border-red-500/10">
            <div className="relative h-64">
              {/* Graph SVG */}
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gasGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
                    <stop offset="100%" stopColor="rgba(239, 68, 68, 0.05)" />
                  </linearGradient>
                </defs>
                
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line
                    key={`grid-${i}`}
                    x1="0"
                    y1={i * 50}
                    x2="800"
                    y2={i * 50}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Graph area */}
                {graphData.length > 1 && (() => {
                  const maxValue = Math.max(...graphData.map(d => d.value), stats.max24h);
                  const minValue = Math.min(...graphData.map(d => d.value), stats.min24h);
                  const range = maxValue - minValue || 1;
                  
                  const points = graphData.map((d, idx) => {
                    const x = (idx / (graphData.length - 1)) * 800;
                    const y = 200 - ((d.value - minValue) / range) * 200;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  const areaPoints = `${points} L800,200 L0,200 Z`;
                  
                  return (
                    <>
                      {/* Area fill */}
                      <path
                        d={`M${areaPoints}`}
                        fill="url(#gasGradient)"
                      />
                      {/* Line */}
                      <polyline
                        points={points}
                        fill="none"
                        stroke="rgba(239, 68, 68, 0.8)"
                        strokeWidth="2"
                      />
                      {/* Data points */}
                      {graphData.map((d, idx) => {
                        const x = (idx / (graphData.length - 1)) * 800;
                        const y = 200 - ((d.value - minValue) / range) * 200;
                        return (
                          <circle
                            key={idx}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="rgba(239, 68, 68, 1)"
                            className="hover:r-5 transition-all"
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
              
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 font-mono pr-2" style={{ fontFamily: 'var(--font-courier-prime)' }}>
                <span>{formatGasPrice(stats.max24h)}</span>
                <span>{formatGasPrice((stats.max24h + stats.min24h) / 2)}</span>
                <span>{formatGasPrice(stats.min24h)}</span>
              </div>
            </div>
            
            {/* X-axis labels */}
            <div className="mt-4 flex justify-between text-xs text-gray-500 font-mono" style={{ fontFamily: 'var(--font-courier-prime)' }}>
              <span>24h ago</span>
              <span>12h ago</span>
              <span>Now</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* No Data Message */}
      {stats && (!graphData || graphData.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-3xl p-12 border-2 border-red-500/20 shadow-2xl backdrop-blur-sm text-center"
        >
          <BarChart3 className="text-red-500/30 mx-auto mb-4" size={64} />
          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-montserrat)' }}>
            No Historical Data Yet
          </h3>
          <p className="text-gray-400">
            Gas price history will appear here as transactions are processed. Check back soon!
          </p>
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
