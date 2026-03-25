"use client";

import { motion } from "framer-motion";
import { Utensils, Zap, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";

type PlanSummaryCardProps = {
    activePlan: string;
    credits: number;
    balance: number;
};

export function PlanSummaryCard({ activePlan, credits, balance }: PlanSummaryCardProps) {
    return (
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-orange-400 font-bold uppercase text-[10px] tracking-widest">
                            <Utensils size={14} /> Subscription Status
                        </div>
                        <h2 className="text-2xl font-black mb-1">{activePlan || "No Active Plan"}</h2>
                        <p className="text-xs text-gray-400 font-medium">
                            {activePlan.includes("Lunch + Dinner") ? "2 Meals deducted daily" : "1 Meal deducted daily"}
                        </p>
                    </div>

                    <div className="mt-8 flex items-end justify-between">
                        <div>
                            <span className="text-5xl font-extrabold text-white leading-none">{credits}</span>
                            <span className="text-sm font-bold text-gray-400 ml-2">Meals Left</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                            <Zap size={18} className="text-orange-400" />
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                       <p className="text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1">BowlIt Wallet</p>
                       <CreditCard size={18} className="text-gray-300" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">₹{balance.toFixed(2)}</h2>
                </div>
                <div className="mt-8">
                    <Link href="/wallet" className="w-full">
                        <button className="w-full bg-gray-50 text-gray-900 px-6 py-4 rounded-xl font-black flex items-center justify-between border-2 border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-colors group">
                            Top Up Balance <ChevronRight size={18} className="text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
