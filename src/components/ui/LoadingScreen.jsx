import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-cream-50 flex items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="w-16 h-16 border-4 border-cream-200 border-t-wood-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="font-display text-wood-700 text-xl">POS Klasik</p>
      <p className="font-body text-wood-400 text-sm mt-1">Memuat...</p>
    </motion.div>
  </div>
);

export default LoadingScreen;
