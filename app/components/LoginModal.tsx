"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      onClose();
      window.location.reload(); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* MODAL BOX */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden z-10"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors z-20"
            >
              <X size={20} className="text-gray-400" />
            </button>

            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-orange-50/50">
                <Mail className="text-orange-600" size={28} />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-500 text-sm mb-8 px-4">
                Enter your email to manage your daily meals.
              </p>

              <form className="space-y-4" onSubmit={handleLogin}>
                
                {/* Email Input */}
                <div className="bg-gray-50 border-2 border-transparent focus-within:border-orange-500 focus-within:bg-white rounded-2xl px-4 py-3 transition-all flex items-center gap-3">
                  <Mail className="text-gray-400" size={20} />
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    className="w-full bg-transparent outline-none text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="bg-gray-50 border-2 border-transparent focus-within:border-orange-500 focus-within:bg-white rounded-2xl px-4 py-3 transition-all flex items-center gap-3 relative">
                  <Lock className="text-gray-400" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full bg-transparent outline-none text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal pr-8"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button 
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 flex items-center justify-center gap-2 hover:bg-orange-700 active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Log In <ArrowRight size={20} /></>}
                </button>
              </form>

              <p className="mt-8 text-sm text-gray-600">
                New to BowlIt?{' '}
                <Link href="/signup" className="font-bold text-orange-600 hover:text-orange-500 hover:underline" onClick={onClose}>
                  Create an account
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}