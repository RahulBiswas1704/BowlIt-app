"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

export default function WalletPage() {
   const [balance, setBalance] = useState(0);
   const [loading, setLoading] = useState(true);
   const [customAmount, setCustomAmount] = useState("");
   const [userId, setUserId] = useState<string | null>(null);
   const [redeemCode, setRedeemCode] = useState("");
   const [redeeming, setRedeeming] = useState(false);
   const [transactions, setTransactions] = useState<any[]>([]);

   useEffect(() => {
      const fetchWallet = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            setUserId(user.id);
            const [walletRes, txRes] = await Promise.all([
               supabase.from('wallets').select('balance').eq('user_id', user.id).single(),
               supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
            ]);
            setBalance(walletRes.data?.balance || 0);
            setTransactions(txRes.data || []);
         }
         setLoading(false);
      };
      fetchWallet();
   }, []);

   const handleTopUp = async (amount: number) => {
      if (!userId) return alert("Please Login!");

      if (confirm(`You are requesting to add ₹${amount} to your wallet.\n\nYou will be redirected to WhatsApp to send the payment confirmation to our Admin team. They will credit your wallet instantly after verifying the payment.`)) {

         const adminPhone = "919999999999"; // REPLACE WITH ACTUAL BOWLIT BUSINESS NUMBER
         const message = `Hi BowlIt Admin! 🍲\n\nI want to top-up *₹${amount}* to my wallet.\nMy User ID is: *${userId}*\n\nHere is my payment screenshot attached below:`;

         const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;

         // Open WhatsApp in a new tab/app
         window.open(whatsappUrl, '_blank');
         // Open WhatsApp in a new tab/app
         window.open(whatsappUrl, '_blank');
         setCustomAmount("");
      }
   };

   const handleRedeem = async () => {
      if (!redeemCode || !userId) return;
      setRedeeming(true);
      try {
         const res = await fetch('/api/wallet/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: redeemCode, user_id: userId })
         });
         const data = await res.json();
         if (data.success) {
            setBalance(data.newBalance);
            const usedCode = redeemCode;
            setRedeemCode("");
            setTransactions(prev => [{
               id: Date.now().toString(),
               description: `Redeemed Promo Code: ${usedCode}`,
               amount: data.amount,
               type: 'CREDIT',
               created_at: new Date().toISOString()
            }, ...prev]);
            alert(`Success! ₹${data.amount} has been securely added to your BowlIt Wallet.`);
         } else {
            alert(data.error || "Failed to redeem code.");
         }
      } catch (err) {
         alert("Network error. Please try again.");
      } finally {
         setRedeeming(false);
      }
   };

   if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" /></div>;

   return (
      <main className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
         <div className="max-w-4xl mx-auto">

            {/* HEADER & BACK BUTTON */}
            <div className="mb-8">
               <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 mb-6 transition-colors font-bold text-sm">
                  <ArrowLeft size={18} /> Back to Home
               </Link>
               <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
               <p className="text-gray-500">Manage your balance and payments.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               {/* BALANCE CARD */}
               <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gray-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-3xl opacity-10 -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 text-gray-400 mb-2"><Wallet size={20} /> Current Balance</div>
                     <div className="text-5xl font-bold mb-8">₹{balance}</div>
                     <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-300"><ShieldCheck size={16} className="text-green-400" /> Secure Payment</div>
                        <div className="flex items-center gap-2 text-sm text-gray-300"><TrendingUp size={16} className="text-blue-400" /> Instant Top-up</div>
                     </div>
                  </div>
               </motion.div>

               {/* ALL TOP UP ACTIONS */}
               <div className="space-y-6">
                  {/* DIRECT TOP UP */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                     <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">Add Money</h3>
                     <div className="grid grid-cols-2 gap-3 mb-6">
                        {[500, 1000, 2000, 5000].map((amt) => (
                           <button key={amt} onClick={() => handleTopUp(amt)} className="py-3 px-4 rounded-xl border border-gray-200 font-bold text-gray-700 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700 transition-all">₹{amt}</button>
                        ))}
                     </div>
                     <div className="relative">
                        <input
                           type="number"
                           placeholder="Enter custom amount"
                           className="w-full p-4 pr-24 bg-gray-50 border-transparent rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                           value={customAmount}
                           onChange={(e) => setCustomAmount(e.target.value)}
                        />
                        <button
                           onClick={() => handleTopUp(parseInt(customAmount))}
                           disabled={!customAmount}
                           className="absolute right-2 top-2 bottom-2 bg-black text-white px-4 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 text-sm"
                        >
                           Top Up
                        </button>
                     </div>
                  </div>

                  {/* PROMO REDEEM */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                     <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">Redeem Promo Code</h3>
                     <div className="relative flex items-center">
                        <input
                           type="text"
                           placeholder="e.g. BOWLIT100"
                           className="w-full p-4 pr-32 bg-gray-50 border-2 border-gray-100 rounded-xl font-black text-gray-900 focus:bg-white focus:border-green-500 outline-none transition-all uppercase tracking-widest placeholder:tracking-normal placeholder:font-bold"
                           value={redeemCode}
                           onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                        />
                        <button
                           onClick={handleRedeem}
                           disabled={!redeemCode || redeeming}
                           className="absolute right-2 top-2 bottom-2 w-28 bg-green-600 text-white rounded-lg font-black uppercase tracking-widest hover:bg-green-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                        >
                           {redeeming ? <Loader2 size={16} className="animate-spin text-white" /> : 'Redeem'}
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full mb-12">
               <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">Recent Activity</h3>
               <div className="space-y-4">
                  {transactions.length === 0 ? (
                     <p className="text-gray-400 text-sm font-bold text-center py-6">No recent transactions found.</p>
                  ) : (
                     transactions.map((tx: any) => (
                        <div key={tx.id} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0">
                           <div className="flex flex-col">
                              <span className="font-bold text-gray-800 text-sm">{tx.description}</span>
                              <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
                                 {new Date(tx.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                           <span className={`font-black text-lg ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-gray-900'}`}>
                              {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                           </span>
                        </div>
                     ))
                  )}
               </div>
            </div>

         </div>
      </main>
   );
}