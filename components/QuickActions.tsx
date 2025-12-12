"use client";

import { Send, TrendingUp, History, BarChart3 } from "lucide-react";

interface QuickActionsProps {
  onTransfer: () => void;
  onStake: () => void;
  onHistory: () => void;
  onAnalytics: () => void;
}

export default function QuickActions({
  onTransfer,
  onStake,
  onHistory,
  onAnalytics,
}: QuickActionsProps) {
  const actions = [
    {
      icon: Send,
      label: "Send Tokens",
      description: "Transfer LUME tokens",
      color: "from-cyan-500 to-blue-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
      borderColor: "border-cyan-200 dark:border-cyan-800",
      onClick: onTransfer,
    },
    {
      icon: TrendingUp,
      label: "Stake",
      description: "Delegate to validators",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      onClick: onStake,
    },
    {
      icon: History,
      label: "History",
      description: "View transactions",
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-800",
      onClick: onHistory,
    },
    {
      icon: BarChart3,
      label: "Analytics",
      description: "Track performance",
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-50 dark:bg-violet-950/20",
      borderColor: "border-violet-200 dark:border-violet-800",
      onClick: onAnalytics,
    },
  ];

  const actionColors = [
    { gradient: "from-sky-500 to-sky-600", bg: "bg-sky-950/40", border: "border-sky-400/50" },
    { gradient: "from-cyan-500 to-cyan-600", bg: "bg-cyan-950/40", border: "border-cyan-400/50" },
    { gradient: "from-blue-500 to-blue-600", bg: "bg-blue-950/40", border: "border-blue-400/50" },
    { gradient: "from-sky-400 to-cyan-500", bg: "bg-sky-950/40", border: "border-sky-400/50" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`group relative ${actionColors[index].bg} ${actionColors[index].border} rounded-3xl p-7 hover:shadow-2xl transition-all duration-300 border-2 hover:scale-[1.03] active:scale-[0.97] hover:border-opacity-80 backdrop-blur-md`}
        >
          <div
            className={`w-16 h-16 bg-gradient-to-br ${actionColors[index].gradient} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl glow-primary`}
          >
            <action.icon className="text-white" size={28} />
          </div>
          <h3 className="font-extrabold text-white mb-2 text-xl tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
            {action.label}
          </h3>
          <p className="text-sm text-gray-300 font-medium">
            {action.description}
          </p>
        </button>
      ))}
    </div>
  );
}

