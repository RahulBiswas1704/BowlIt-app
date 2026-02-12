"use client";
import { useState, useEffect } from "react";
import { X, ShoppingBag, ArrowRight, Loader2, MapPin, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, clearCart, total } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState("");
  
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [newAddress, setNewAddress] = useState(""); 
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          if (user.user_metadata) {
            setCustomer({
              name: user.user_metadata.full_name || "",
              phone: user.user_metadata.phone || "",
            });
            let addresses = user.user_metadata.addresses || [];
            if (addresses.length === 0 && user.user_metadata.office) addresses = [user.user_metadata.office];
            setSavedAddresses(addresses);
            if (addresses.length > 0) setSelectedAddress(addresses[0]);
            else setIsAddingNew(true);
          }
          const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
          setBalance(wallet?.balance || 0);
        }
      };
      fetchData();
    }
  }, [isOpen, loading]);

  const handleQuickTopUp = async () => {
    if (!userId || !topUpAmount) return;
    const amount = parseInt(topUpAmount);
    setLoading(true);
    const { error } = await supabase.from('wallets').upsert({ user_id: userId, balance: balance + amount });
    if (!error) {
        alert("Top up successful!");
        setBalance(prev => prev + amount); 
        setTopUpAmount("");
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    const finalAddress = isAddingNew ? newAddress : selectedAddress;
    if (!customer.name || !customer.phone || !finalAddress) return alert("Please fill all details!");

    if (balance < total) return alert(`Insufficient Balance!`);

    setLoading(true);

    // 1. Deduct Money
    const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: balance - total })
        .eq('user_id', userId);

    if (walletError) {
        alert("Payment Error: " + walletError.message);
        setLoading(false);
        return;
    }

    // 2. CHECK FOR SUBSCRIPTION PLANS IN CART
    const subscriptionItem = cart.find(item => item.type === "Subscription");
    if (subscriptionItem) {
        // SMART LOGIC: Check if it is a Lunch + Dinner plan (60 credits) or Standard (30)
        const isDoublePlan = subscriptionItem.name.includes("Lunch + Dinner");
        const creditsToAdd = isDoublePlan ? 60 : 30;
        
        // Fetch existing credits
        const { data: { user } } = await supabase.auth.getUser();
        const currentCredits = user?.user_metadata.credits || 0;

        await supabase.auth.updateUser({
            data: {
                active_plan: subscriptionItem.name,
                credits: currentCredits + creditsToAdd,
                plan_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
        });
        alert(`Plan Activated! You now have ${currentCredits + creditsToAdd} credits.`);
    }

    // 3. Create Order Record
    const { error: orderError } = await supabase
      .from('orders')
      .insert([{ 
          customer_name: customer.name,
          customer_phone: customer.phone,
          address: finalAddress,
          items: cart, 
          total_amount: total
      }]);

    if (!orderError) {
       if (isAddingNew) {
          const updatedAddresses = [...savedAddresses, finalAddress];
          const uniqueAddresses = Array.from(new Set(updatedAddresses));
          await supabase.auth.updateUser({ data: { addresses: uniqueAddresses } });
       }
       if (!subscriptionItem) alert("Order Placed Successfully!"); 
       clearCart();
       setIsCheckingOut(false);
       onClose();
    }
    setLoading(false);
  };

  const cartLength = cart?.length || 0;
  const deficit = Math.max(0, total - balance); 

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="text-orange-600" /> Your Cart
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartLength === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <ShoppingBag size={64} className="opacity-20" />
                  <p>Your bowl is empty.</p>
                  <button onClick={onClose} className="text-orange-600 font-bold hover:underline">Start Ordering</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0"><img src={item.image} className="w-full h-full object-cover" /></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                              <h4 className="font-bold text-gray-900 leading-tight">{item.name}</h4>
                              {item.type === "Subscription" && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Plan</span>}
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14} /></button>
                        </div>
                        <p className="text-orange-600 font-mono text-sm font-bold mt-1">₹{item.price}</p>
                        {/* Show plan details if it's a subscription */}
                        {item.type === "Subscription" && <p className="text-xs text-gray-400 mt-1">{item.plan}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartLength > 0 && (
              <div className="p-6 border-t bg-gray-50 space-y-4">
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Total Bill</span>
                  <span>₹{total}</span>
                </div>

                {isCheckingOut && deficit > 0 && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-red-600 font-bold mb-2"><AlertCircle size={18} /> Low Balance</div>
                        <p className="text-sm text-gray-600 mb-3">You have <strong>₹{balance}</strong>. You need <strong>₹{deficit}</strong> more.</p>
                        <div className="flex gap-2">
                            <input type="number" className="w-full p-2 border rounded-lg" placeholder={`Enter ₹${deficit}+`} value={topUpAmount} onFocus={() => !topUpAmount && setTopUpAmount(deficit.toString())} onChange={(e) => setTopUpAmount(e.target.value)} />
                            <button onClick={handleQuickTopUp} disabled={loading || !topUpAmount || parseInt(topUpAmount) < deficit} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap disabled:opacity-50">{loading ? "..." : "Add & Retry"}</button>
                        </div>
                    </div>
                )}

                {isCheckingOut ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Name" className="w-full p-3 border rounded-xl font-bold text-gray-800 text-sm" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                        <input type="tel" placeholder="Phone" className="w-full p-3 border rounded-xl font-bold text-gray-800 text-sm" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                    </div>
                    
                    <div className="relative">
                        <MapPin className="absolute top-3.5 left-3 text-gray-400" size={18} />
                        {!isAddingNew && savedAddresses.length > 0 ? (
                            <select className="w-full p-3 pl-10 border rounded-xl font-bold text-gray-800 bg-white" value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)}>
                                {savedAddresses.map((addr, idx) => <option key={idx} value={addr}>{addr}</option>)}
                            </select>
                        ) : (
                            <input type="text" placeholder="New address..." className="w-full p-3 pl-10 border rounded-xl font-bold text-gray-800" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
                        )}
                        {savedAddresses.length > 0 && <button onClick={() => setIsAddingNew(!isAddingNew)} className="absolute right-3 top-3.5 text-xs text-orange-600 font-bold">{isAddingNew ? "Select Saved" : "+ Add New"}</button>}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                       <button onClick={() => setIsCheckingOut(false)} className="w-1/3 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                       <button onClick={handlePayment} disabled={loading || deficit > 0} className="w-2/3 bg-black text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 disabled:bg-gray-400">
                            {loading ? <Loader2 className="animate-spin" /> : `Pay ₹${total}`}
                       </button>
                    </div>
                  </motion.div>
                ) : (
                  <button onClick={() => setIsCheckingOut(true)} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 flex items-center justify-center gap-2 hover:bg-orange-700 transition">
                    Checkout <ArrowRight size={20} />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}