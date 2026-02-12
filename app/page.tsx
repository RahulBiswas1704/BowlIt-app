"use client";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import MenuCard from "./components/MenuCard";
import { motion } from "framer-motion";
import { CheckCircle, Truck, ChefHat, Loader2, ArrowRight, Zap, Leaf, Beef, Sun, Moon, ShoppingBag, Calendar, CreditCard, MousePointerClick, Utensils } from "lucide-react";
import { supabase } from "./lib/supabaseClient"; 
import { useCart } from "./context/CartContext"; 

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  type: "Veg" | "Non-Veg";
  is_available: boolean;
};

export default function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTiming, setSelectedTiming] = useState("Lunch Only"); // Default
  
  const { addToCart } = useCart(); 

  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true); 
      
      if (error) console.error(error);
      else setMenuItems(data as any || []);
      setLoading(false);
    };

    fetchMenu();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddPlan = (planName: string, basePrice: number, baseDesc: string) => {
    let finalPrice = basePrice;
    let finalName = `${planName} (${selectedTiming})`;
    let finalDesc = baseDesc;

    if (selectedTiming === "Lunch + Dinner") {
        const doublePrice = basePrice * 2;
        finalPrice = Math.round(doublePrice * 0.85); 
        finalName = `${planName} (Lunch + Dinner)`;
        finalDesc = "60 Meals (Double Plan) • 15% Savings Applied";
    }

    addToCart({
        id: "", 
        name: finalName,
        price: finalPrice,
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
        type: "Subscription", 
        plan: finalDesc
    });

    alert(`${finalName} added for ₹${finalPrice}!`);
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      {/* HERO SECTION */}
      <section className="pt-32 pb-16 px-6 text-center lg:text-left lg:flex lg:items-center lg:justify-between max-w-6xl mx-auto">
        <div className="lg:w-1/2 mb-10 lg:mb-0">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold text-gray-900 leading-tight mb-6"
          >
            Office Lunch, <br/>
            <span className="text-orange-600">Reinvented.</span>
          </motion.h1>
          <p className="text-gray-500 text-xl mb-8 max-w-md mx-auto lg:mx-0">
            Batched delivery to Newtown's top tech parks. Homestyle food, zero delivery fees.
          </p>
          <div className="flex gap-4 justify-center lg:justify-start">
            <button 
              onClick={() => scrollToSection('plans')}
              className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              View Plans <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              How it Works
            </button>
          </div>
        </div>
        
        <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="lg:w-1/2"
        >
          <img 
            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80" 
            className="rounded-[3rem] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
            alt="Healthy Bowl"
          />
        </motion.div>
      </section>

      {/* --- UPDATED: HOW BOWLIST WORKS --- */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-orange-600 font-bold tracking-wider uppercase text-sm">How Bowlit Works</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Simple Steps to Healthy Eating</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* STEP 1 */}
            <div className="relative p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all text-center group">
              <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 font-bold text-xl w-10 h-10 flex items-center justify-center rounded-bl-2xl rounded-tr-3xl">1</div>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 group-hover:scale-110 transition-transform">
                <MousePointerClick size={32} />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Choose Plan</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Select from Green, Smart Mix, or Red plans tailored to you.</p>
            </div>

            {/* STEP 2 */}
            <div className="relative p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all text-center group">
              <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 font-bold text-xl w-10 h-10 flex items-center justify-center rounded-bl-2xl rounded-tr-3xl">2</div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                <Calendar size={32} />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Set Start Date</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Choose exactly when you want your meal subscription to begin.</p>
            </div>

            {/* STEP 3 */}
            <div className="relative p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all text-center group">
              <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 font-bold text-xl w-10 h-10 flex items-center justify-center rounded-bl-2xl rounded-tr-3xl">3</div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 group-hover:scale-110 transition-transform">
                <CreditCard size={32} />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Make Payment</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Secure and fast payment via our Razorpay integration.</p>
            </div>

            {/* STEP 4 */}
            <div className="relative p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all text-center group">
              <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 font-bold text-xl w-10 h-10 flex items-center justify-center rounded-bl-2xl rounded-tr-3xl">4</div>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600 group-hover:scale-110 transition-transform">
                <Utensils size={32} />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Enjoy Meals</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Fresh meals delivered daily at your chosen time slot.</p>
            </div>

          </div>
        </div>
      </section>

      {/* MEAL TIMING SELECTOR */}
      <section className="px-6 max-w-6xl mx-auto pt-10">
        <div className="bg-gray-100 rounded-[2rem] p-8 md:p-10">
           <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">1. Choose Meal Timing</h3>
           </div>
           
           <div className="grid md:grid-cols-3 gap-4">
              <button 
                onClick={() => setSelectedTiming("Lunch Only")}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${selectedTiming === "Lunch Only" ? "bg-white border-orange-500 shadow-md transform scale-105" : "bg-transparent border-transparent hover:bg-white hover:border-gray-200"}`}
              >
                 <Sun size={28} className={selectedTiming === "Lunch Only" ? "text-orange-500" : "text-gray-400"} />
                 <div className="font-bold text-gray-900">Lunch Only</div>
              </button>

              <button 
                onClick={() => setSelectedTiming("Dinner Only")}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${selectedTiming === "Dinner Only" ? "bg-white border-blue-500 shadow-md transform scale-105" : "bg-transparent border-transparent hover:bg-white hover:border-gray-200"}`}
              >
                 <Moon size={28} className={selectedTiming === "Dinner Only" ? "text-blue-500" : "text-gray-400"} />
                 <div className="font-bold text-gray-900">Dinner Only</div>
              </button>

              <button 
                onClick={() => setSelectedTiming("Lunch + Dinner")}
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${selectedTiming === "Lunch + Dinner" ? "bg-gray-900 border-gray-900 shadow-md text-white transform scale-105" : "bg-white border-gray-200"}`}
              >
                 {selectedTiming === "Lunch + Dinner" && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">SAVE 15%</div>}
                 <div className="flex gap-1"><Sun size={28} className="text-orange-500"/><Moon size={28} className="text-blue-400"/></div>
                 <div className="font-bold">Lunch + Dinner</div>
              </button>
           </div>
        </div>
      </section>

      {/* PLANS SECTION */}
      <section id="plans" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-orange-600 font-bold tracking-wider uppercase text-sm">Choose Your Plan</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">Curated for Your Lifestyle</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* GREEN PLAN */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-200 transition-all group">
             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform"><Leaf size={24} /></div>
             <h3 className="text-xl font-bold text-gray-900">Green Plan</h3>
             <p className="text-sm text-gray-500 mb-6">Vegetarian Delight</p>
             <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-extrabold text-gray-900">₹2,999</span>
                <span className="text-gray-400 font-medium">/mo</span>
             </div>
             <ul className="space-y-4 mb-8">
                <li className="flex gap-3 text-sm text-gray-600"><CheckCircle size={18} className="text-green-500 shrink-0"/> 30 Veg Meals</li>
                <li className="flex gap-3 text-sm text-gray-600"><CheckCircle size={18} className="text-green-500 shrink-0"/> Calorie Counted</li>
             </ul>
             <button 
                onClick={() => handleAddPlan('Green Plan', 2999, '30 Vegetarian Meals')}
                className="w-full py-4 rounded-xl border-2 border-green-600 text-green-700 font-bold hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2"
             >
                 <ShoppingBag size={18} /> Add {selectedTiming === "Lunch + Dinner" ? "Combo" : "Plan"}
             </button>
          </div>

          {/* SMART MIX */}
          <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl relative transform md:-translate-y-4 border border-gray-800">
             <div className="absolute top-0 right-0 bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl rounded-tr-[2.5rem] uppercase tracking-wider">Most Popular</div>
             <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500 mb-6"><Zap size={24} /></div>
             <h3 className="text-xl font-bold text-white">Smart Mix</h3>
             <p className="text-sm text-gray-400 mb-6">Balanced Nutrition</p>
             <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-extrabold text-white">₹3,499</span>
                <span className="text-gray-400 font-medium">/mo</span>
             </div>
             <ul className="space-y-4 mb-8">
                <li className="flex gap-3 text-sm text-gray-300"><CheckCircle size={18} className="text-orange-500 shrink-0"/> 20 Veg + 10 Non-Veg</li>
                <li className="flex gap-3 text-sm text-gray-300"><CheckCircle size={18} className="text-orange-500 shrink-0"/> Protein Focused</li>
             </ul>
             <button 
                onClick={() => handleAddPlan('Smart Mix', 3499, '20 Veg + 10 Non-Veg Meals')}
                className="w-full py-4 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/50 flex items-center justify-center gap-2"
             >
                <ShoppingBag size={18} /> Add {selectedTiming === "Lunch + Dinner" ? "Combo" : "Plan"}
             </button>
          </div>

          {/* RED PLAN */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-red-200 transition-all group">
             <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6 group-hover:scale-110 transition-transform"><Beef size={24} /></div>
             <h3 className="text-xl font-bold text-gray-900">Red Plan</h3>
             <p className="text-sm text-gray-500 mb-6">High Protein Power</p>
             <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-extrabold text-gray-900">₹3,999</span>
                <span className="text-gray-400 font-medium">/mo</span>
             </div>
             <ul className="space-y-4 mb-8">
                <li className="flex gap-3 text-sm text-gray-600"><CheckCircle size={18} className="text-red-500 shrink-0"/> 30 Non-Veg Meals</li>
                <li className="flex gap-3 text-sm text-gray-600"><CheckCircle size={18} className="text-red-500 shrink-0"/> High Protein</li>
             </ul>
             <button 
                onClick={() => handleAddPlan('Red Plan', 3999, '30 Non-Veg Meals')}
                className="w-full py-4 rounded-xl border-2 border-red-600 text-red-700 font-bold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
             >
                 <ShoppingBag size={18} /> Add {selectedTiming === "Lunch + Dinner" ? "Combo" : "Plan"}
             </button>
          </div>

        </div>
      </section>

      {/* MENU GRID */}
      <section id="menu-section" className="px-6 max-w-6xl mx-auto py-20">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Today's Menu</h2>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-600" size={40} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => <MenuCard key={item.id} title={item.name} description={item.description} price={`₹${item.price}`} type={item.type} image={item.image} />)}
          </div>
        )}
      </section>
    </main>
  );
}