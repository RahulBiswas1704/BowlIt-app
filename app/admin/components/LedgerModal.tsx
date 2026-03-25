import { useState, useEffect } from "react";
import { X, Loader2, ArrowRightLeft } from "lucide-react";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdminClient";

export function LedgerModal({ isOpen, customerId, customerName, onClose }: { isOpen: boolean, customerId: string, customerName: string, onClose: () => void }) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && customerId) {
            setLoading(true);
            supabase.from('wallet_transactions').select('*').eq('user_id', customerId).order('created_at', { ascending: false })
                .then(({ data }) => {
                    setTransactions(data || []);
                    setLoading(false);
                });
        }
    }, [isOpen, customerId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-md">
                            <ArrowRightLeft size={18} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Wallet Ledger</h2>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{customerName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-black mt-[-10px] mr-[-10px]"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-full mb-4">
                                <span className="text-2xl filter grayscale opacity-50">💸</span>
                            </div>
                            <p className="font-bold text-gray-400">No transactions recorded.</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">This user has not made any wallet top-ups or redemptions yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-gray-200 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-gray-800">{tx.description}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{new Date(tx.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md ${tx.type === 'CREDIT' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                            {tx.type}
                                        </div>
                                        <span className={`font-black tracking-wider text-lg ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                                            {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
