"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  ChefHat, Plus, Trash2, Loader2, X, Lock, LogOut, 
  ShoppingBag, Utensils, CheckCircle, Clock, MapPin, 
  LayoutDashboard, CreditCard, Users, TrendingDown, 
  Download, Bike, UserPlus, Phone
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";

// --- TYPES ---
type MenuItem = { id: number; name: string; price: number; type: string; is_available: boolean; description?: string; image?: string; };
type Order = { id: number; created_at: string; customer_name: string; customer_phone: string; address: string; items: any[]; total_amount: number; status: string; rider_phone: string | null; };
type Rider = { phone: string; name: string; status: string; };

const formatMoney = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('admins').select('id').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (data) { setSession(session); setIsAdmin(true); }
            setLoading(false);
          });
      } else { setLoading(false); }
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={48} /></div>;
  if (!session || !isAdmin) return <AdminLogin onLoginSuccess={() => window.location.reload()} />;

  return <AdminDashboard />;
}

// --- ADMIN LOGIN ---
function AdminLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else if (data.user) onLoginSuccess();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Portal</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full border rounded-xl p-3" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full border rounded-xl p-3" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold">{loading ? "..." : "Login"}</button>
        </form>
      </div>
    </div>
  );
}

// --- DASHBOARD ---
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'fleet'>('overview');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);

  // Modals
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [isAddingRider, setIsAddingRider] = useState(false);
  
  const [newItem, setNewItem] = useState({ name: "", price: "", type: "Veg", description: "", image: "" });
  const [newRider, setNewRider] = useState({ name: "", phone: "", password: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: o } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('menu_items').select('*').order('id', { ascending: true });
    const { data: r } = await supabase.from('riders').select('*');
    setOrders(o || []);
    setMenuItems(m || []);
    setRiders(r || []);
    setLoading(false);
  };

  // Synchronized Stats
  const stats = useMemo(() => ({
    revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    pending: orders.filter(o => o.status !== 'Completed').length,
    totalOrders: orders.length,
    activeRiders: riders.length
  }), [orders, riders]);

  // --- ACTIONS ---
  const handleAddItem = async () => {
    await supabase.from('menu_items').insert([newItem]);
    setIsAddingDish(false);
    fetchData();
  };

  const handleAddRider = async () => {
    const { error } = await supabase.from('riders').insert([newRider]);
    if (error) alert(error.message);
    else { setIsAddingRider(false); fetchData(); }
  };

  const assignRider = async (orderId: number, phone: string) => {
    await supabase.from('orders').update({ rider_phone: phone, status: 'Out for Delivery' }).eq('id', orderId);
    fetchData();
  };

  const updateOrderStatus = async (id: number, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    fetchData();
  };

  const toggleStock = async (id: number, available: boolean) => {
    await supabase.from('menu_items').update({ is_available: !available }).eq('id', id);
    fetchData();
  };

  const deleteItem = async (id: number) => {
    if(confirm("Delete dish?")) { await supabase.from('menu_items').delete().eq('id', id); fetchData(); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white p-6 fixed h-full">
        <div className="flex items-center gap-2 mb-10 text-orange-500 font-bold text-2xl"><ChefHat /> Admin</div>
        <nav className="space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={<ShoppingBag size={20}/>} label="Live Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <SidebarItem icon={<Bike size={20}/>} label="Fleet Manager" active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} />
          <SidebarItem icon={<Utensils size={20}/>} label="Menu Manager" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="mt-auto flex items-center gap-2 text-red-400 font-bold pt-10"><LogOut size={16}/> Logout</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 ml-64">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold capitalize">{activeTab}</h1>
            <div className="flex gap-2">
                {activeTab === 'fleet' && <button onClick={() => setIsAddingRider(true)} className="bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><UserPlus size={18}/> Add Rider</button>}
                {activeTab === 'menu' && <button onClick={() => setIsAddingDish(true)} className="bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> Add Dish</button>}
            </div>
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div> : (
          <>
            {activeTab === 'overview' && (
                <div className="grid grid-cols-4 gap-6">
                    <StatCard title="Revenue" value={formatMoney(stats.revenue)} icon={<CreditCard className="text-green-600"/>} />
                    <StatCard title="Riders" value={stats.activeRiders.toString()} icon={<Bike className="text-orange-600"/>} />
                    <StatCard title="Total Orders" value={stats.totalOrders.toString()} icon={<ShoppingBag className="text-blue-600"/>} />
                    <StatCard title="Pending" value={stats.pending.toString()} icon={<Clock className="text-red-600"/>} />
                </div>
            )}

            {activeTab === 'orders' && (
               <div className="space-y-4">
                 {orders.map((order) => (
                     <div key={order.id} className="bg-white p-6 rounded-2xl border flex justify-between items-center">
                       <div>
                         <div className="flex items-center gap-2 mb-1"><span className="font-bold">#{order.id}</span><span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">{order.status}</span></div>
                         <h3 className="font-bold">{order.customer_name}</h3>
                         <p className="text-gray-500 text-sm">{order.address}</p>
                       </div>
                       <div className="flex flex-col gap-2">
                           <select className="p-2 border rounded-lg text-sm font-bold" value={order.rider_phone || ""} onChange={(e) => assignRider(order.id, e.target.value)}>
                               <option value="">Assign Rider</option>
                               {riders.map(r => <option key={r.phone} value={r.phone}>{r.name}</option>)}
                           </select>
                           <button onClick={() => updateOrderStatus(order.id, 'Completed')} className="bg-green-600 text-white p-2 rounded-lg text-xs font-bold">Mark Done</button>
                       </div>
                     </div>
                 ))}
               </div>
            )}

            {activeTab === 'fleet' && (
                <div className="bg-white rounded-2xl border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold uppercase"><tr><th className="p-4">Name</th><th className="p-4">Phone (ID)</th><th className="p-4">Status</th></tr></thead>
                        <tbody className="divide-y">
                            {riders.map(r => (
                                <tr key={r.phone}><td className="p-4 font-bold">{r.name}</td><td className="p-4">{r.phone}</td><td className="p-4 text-green-600 font-bold">{r.status}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'menu' && (
                <div className="bg-white rounded-2xl border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold uppercase"><tr><th className="p-4">Dish</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4 text-right">Actions</th></tr></thead>
                        <tbody className="divide-y">
                            {menuItems.map(item => (
                                <tr key={item.id}>
                                    <td className="p-4 font-bold">{item.name}</td>
                                    <td className="p-4">₹{item.price}</td>
                                    <td className="p-4"><button onClick={() => toggleStock(item.id, item.is_available)} className={`px-2 py-1 rounded text-xs font-bold ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.is_available ? "In Stock" : "Out"}</button></td>
                                    <td className="p-4 text-right"><button onClick={() => deleteItem(item.id)} className="text-red-500"><Trash2 size={18}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </>
        )}

        {/* MODALS */}
        {isAddingRider && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                    <h3 className="text-xl font-bold mb-4">Add Rider</h3>
                    <div className="space-y-3">
                        <input className="w-full border p-3 rounded-xl" placeholder="Name" onChange={e => setNewRider({...newRider, name: e.target.value})} />
                        <input className="w-full border p-3 rounded-xl font-bold" placeholder="Phone (Login ID)" onChange={e => setNewRider({...newRider, phone: e.target.value})} />
                        <input className="w-full border p-3 rounded-xl" type="password" placeholder="Password" onChange={e => setNewRider({...newRider, password: e.target.value})} />
                        <button onClick={handleAddRider} className="w-full bg-black text-white p-3 rounded-xl font-bold">Onboard Rider</button>
                        <button onClick={() => setIsAddingRider(false)} className="w-full text-gray-400 mt-2">Cancel</button>
                    </div>
                </div>
            </div>
        )}

        {isAddingDish && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                    <h3 className="text-xl font-bold mb-4">Add Dish</h3>
                    <div className="space-y-3">
                        <input className="w-full border p-3 rounded-xl" placeholder="Name" onChange={e => setNewItem({...newItem, name: e.target.value})} />
                        <input className="w-full border p-3 rounded-xl" type="number" placeholder="Price" onChange={e => setNewItem({...newItem, price: e.target.value})} />
                        <select className="w-full border p-3 rounded-xl" onChange={e => setNewItem({...newItem, type: e.target.value})}><option value="Veg">Veg</option><option value="Non-Veg">Non-Veg</option></select>
                        <button onClick={handleAddItem} className="w-full bg-black text-white p-3 rounded-xl font-bold">Save Dish</button>
                        <button onClick={() => setIsAddingDish(false)} className="w-full text-gray-400 mt-2">Cancel</button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${active ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            {icon} {label}
        </button>
    );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: any }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between h-32">
            <div className="flex justify-between items-start"><span className="text-gray-500 font-bold text-sm">{title}</span><div className="p-2 bg-gray-50 rounded-lg">{icon}</div></div>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
    );
}