"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { supabaseAdmin as supabase } from "../../lib/supabaseAdminClient";

export function PromoManager() {
    const [promos, setPromos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [code, setCode] = useState("");
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
        if (data) setPromos(data);
        setLoading(false);
    };

    const handleGenerate = async () => {
        if (!amount || isNaN(Number(amount))) return alert("Invalid amount.");
        if (!code) return alert("Please enter a custom code or click generate random.");
        setGenerating(true);

        const { error } = await supabase.from('promo_codes').insert({
            code: code.toUpperCase(),
            amount: Number(amount)
        });

        if (error) {
            alert("Error generating code: " + error.message);
        } else {
            alert("Promo Code generated successfully!");
            setCode("");
            setAmount("");
            fetchPromos();
        }
        setGenerating(false);
    };

    const deletePromo = async (id: string) => {
        if (!confirm("Delete this promo code?")) return;
        const { error } = await supabase.from('promo_codes').delete().eq('id', id);
        if (error) alert("Error deleting: " + error.message);
        else fetchPromos();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 flex-wrap">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Custom/Random Code</label>
                    <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 ring-orange-500 transition-shadow w-max">
                        <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. BOWLIT100" className="p-3 bg-transparent outline-none font-black tracking-widest uppercase w-48 text-gray-900 placeholder-gray-300" />
                        <button onClick={() => setCode("BOWL" + Math.floor(10000 + Math.random() * 90000))} className="px-5 bg-gray-200 hover:bg-gray-300 text-[10px] uppercase font-black tracking-widest transition-colors border-l border-gray-300 text-gray-600">Random</button>
                    </div>
                </div>
                <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wallet Value (₹)</label>
                     <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-36 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg outline-none focus:ring-2 ring-orange-500 transition-shadow" />
                </div>
                <div className="self-end pb-0.5">
                    <button disabled={generating} onClick={handleGenerate} className="bg-black text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md mt-auto">
                        {generating ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Create Code</>}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
                        <tr>
                            <th className="p-4">Promo Code</th>
                            <th className="p-4">Value</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Redemption Data</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="animate-spin text-orange-500 mx-auto" /></td></tr>
                        ) : promos.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-medium">No marketing promo codes generated yet. Generate some above to distribute to customers!</td></tr>
                        ) : promos.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 font-mono font-black tracking-[0.2em] text-gray-800">{p.code}</div>
                                </td>
                                <td className="p-4 font-black text-xl text-green-600">₹{p.amount}</td>
                                <td className="p-4">
                                    {p.is_used ? (
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full w-fit"><CheckCircle2 size={14} /> Redeemed</span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-green-600 bg-green-50 shadow-[inset_0_0_0_1px_rgba(22,163,74,0.2)] px-3 py-1.5 rounded-full w-fit"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active</span>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-gray-500 font-medium">
                                    {p.used_at ? new Date(p.used_at).toLocaleString() : '-'}
                                    {p.used_by && <div className="text-[10px] uppercase font-bold mt-1 text-blue-500 bg-blue-50 w-fit px-2 rounded tracking-widest" title={p.used_by}>UID: {p.used_by.split('-')[0]}...</div>}
                                </td>
                                <td className="p-4 text-right">
                                    {!p.is_used && (
                                        <button onClick={() => deletePromo(p.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
