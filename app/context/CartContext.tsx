"use client";
import { createContext, useContext, useState, ReactNode } from "react";

// Define what an Item looks like
export type CartItem = {
  id: string; // Changed to string to match MenuCard
  name: string;
  price: number;
  image: string;
  plan?: string;
  type?: string; 
};

// Define what the Context provides
type CartContextType = {
  cart: CartItem[];      // Renamed from 'items' to 'cart'
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;         // Renamed from 'cartTotal' to 'total'
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]); // Renamed state to 'cart'

  const addToCart = (item: CartItem) => {
    // Generate a unique String ID
    const uniqueItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    setCart((prev) => [...prev, uniqueItem]);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook to use the cart easily
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}