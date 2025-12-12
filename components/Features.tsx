"use client";

import { Sparkles, Globe, Lock, Cpu } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Sparkles,
      title: "Advanced Technology",
      description: "Built on cutting-edge blockchain infrastructure",
    },
    {
      icon: Globe,
      title: "IBC Compatible",
      description: "Interoperable with Cosmos ecosystem",
    },
    {
      icon: Lock,
      title: "Secure",
      description: "Built with CometBFT consensus",
    },
    {
      icon: Cpu,
      title: "High Performance",
      description: "Fast finality and throughput",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-[#111118] to-[#0f0f15] rounded-3xl p-7 border-2 border-sky-500/20 shadow-xl backdrop-blur-md">
      <h3 className="text-2xl font-extrabold text-white mb-6 tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
        Prism Features
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {features.map((feature, index) => {
          const colors = [
            "from-sky-500 to-sky-600",
            "from-cyan-500 to-cyan-600",
            "from-blue-500 to-blue-600",
            "from-sky-400 to-cyan-500",
          ];
          return (
            <div key={index} className="flex items-start gap-4 group hover:bg-white/5 p-3 rounded-2xl transition-all duration-300">
              <div className={`w-14 h-14 bg-gradient-to-br ${colors[index]} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg glow-primary group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="text-white" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white text-base mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-300 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

