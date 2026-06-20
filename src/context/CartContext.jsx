import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

// Ubah nilai ini sesuai kebutuhan toko
const ATURAN = {
  DISKON_PERSEN: 10,
  DISKON_MIN_BELANJA: 100000,
  PPN_PERSEN: 11,
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stok) }
            : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) return removeItem(id);
    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: Math.min(qty, i.stok) } : i)
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('pos_cart');
  };

  // Hitung subtotal
  const subtotal = items.reduce((sum, i) => sum + i.harga_jual * i.quantity, 0);

  // Diskon otomatis
  const diskon = subtotal >= ATURAN.DISKON_MIN_BELANJA
    ? Math.round(subtotal * ATURAN.DISKON_PERSEN / 100)
    : 0;

  // PPN otomatis (dihitung dari subtotal setelah diskon)
  const subtotalSetelahDiskon = subtotal - diskon;
  const pajakVal = Math.round(
  subtotalSetelahDiskon * ATURAN.PPN_PERSEN / 100
  );

  // Total akhir
  const total = subtotalSetelahDiskon + pajakVal;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      subtotal, diskon, pajakVal, total, ATURAN,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
