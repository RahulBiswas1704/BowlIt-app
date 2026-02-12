"use client";
import { useState, useEffect } from "react";
import { Bike, Phone, MapPin, CheckCircle, LogOut, Loader2, Package } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function RiderPanel() {
  const [rider, setRider] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Simple Session Management via LocalStorage
  useEffect(() => {
    const savedRider = localStorage.getItem("rider_session");
    if (savedRider) {
      setRider(JSON.parse(savedRider));
      fetchOrders(JSON.parse(savedRider).phone);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Check against the 'riders' table
    const { data, error } = await supabase.from('riders').select('*').eq('phone', phone).eq('password', password).single();

    if (data) {
      localStorage.setItem("rider_session", JSON.stringify(data));
      setRider(data);
      fetchOrders(data.phone);
    } else {
      alert("Invalid Phone or Password");
    }
    setLoading(false);
  };

  const fetchOrders = async (riderPhone: string) => {
    const { data } = await supabase.from('orders').select('*').eq('rider_phone', riderPhone).neq('status', 'Completed');
    setOrders(data || []);
  };

  const markDelivered = async (id: number) => {
    await supabase.from('orders').update({ status: 'Completed' }).eq('id', id);
    fetchOrders(rider.phone);
  };

  if (!rider) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm text-center">
          <Bike className="mx-auto text-orange-600 mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-6">Rider Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input className="w-full border p-4 rounded-2xl font-bold" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
            <input className="w-full border p-4 rounded-2xl" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full bg-orange-600 text-white p-4 rounded-2xl font-bold shadow-lg">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-900 text-white p-6 rounded-b-[2rem] flex justify-between items-center">
        <div>
          <h1 className="font-bold text-lg">Hi, {rider.name}</h1>
          <p className="text-xs text-orange-400 font-bold">{rider.phone}</p>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-2 bg-gray-800 rounded-full"><LogOut size={18}/></button>
      </header>

      <div className="p-6 space-y-4">
        <h2 className="font-bold text-gray-500 uppercase text-xs">My Deliveries</h2>
        {orders.length === 0 ? (
            <div className="text-center py-20 text-gray-400"><Package size={40} className="mx-auto mb-2 opacity-20"/>No assigned orders.</div>
        ) : (
            orders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-3">
                        <span className="font-bold text-orange-600">#{order.id}</span>
                        <span className="font-bold">₹{order.total_amount}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{order.customer_name}</h3>
                    <div className="flex gap-2 text-gray-500 mb-4"><MapPin size={16}/> <p className="text-sm">{order.address}</p></div>
                    <div className="flex gap-2">
                        <a href={`tel:${order.customer_phone}`} className="flex-1 bg-gray-100 p-3 rounded-xl flex justify-center"><Phone size={20}/></a>
                        <button onClick={() => markDelivered(order.id)} className="flex-[3] bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                           <CheckCircle size={20}/> Delivered
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}