import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ title, value, icon: Icon, trend, trendValue, color = "purple" }) {
  const colors = {
    purple: "from-[#C4967A] to-[#b07e63]",
    green: "from-[#C4967A] to-[#b07e63]",
    blue: "from-[#a07060] to-[#C4967A]",
    amber: "from-[#d4a890] to-[#C4967A]",
    rose: "from-[#C4967A] to-[#a07060]",
  };

  return (
    <Card className="relative overflow-hidden bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-[#C4967A]/10">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
            {trendValue && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-medium">{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors[color]}`} />
    </Card>
  );
}
