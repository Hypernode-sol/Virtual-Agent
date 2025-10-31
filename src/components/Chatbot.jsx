import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
        toast({
            title: '🚧 Hyper Assistant is Coming Soon!',
            description: "This feature isn't implemented yet—but don't worry! It's on the way! 🚀",
          });
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={handleToggle}
          className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-2xl shadow-cyan-500/30"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute inset-0"
              >
                <img
                  alt="Hyper Assistant Avatar"
                  className="w-full h-full rounded-full object-cover"
                 src="https://horizons-cdn.hostinger.com/1e54f271-6c35-4f84-9c56-0768238922fb/f9f3a62de5e9b1fcf902482186312fd6.png" />
              </motion.div>
            )}
          </AnimatePresence>
           <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
              >
                <X size={32} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed bottom-24 right-6 z-40 w-[320px] h-[450px] bg-black/50 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-cyan-500/30 flex items-center gap-3">
              <img src="https://horizons-cdn.hostinger.com/1e54f271-6c35-4f84-9c56-0768238922fb/f9f3a62de5e9b1fcf902482186312fd6.png" alt="Hyper Assistant" className="w-8 h-8 rounded-full object-cover" />
              <h3 className="font-bold text-lg text-cyan-400">Hyper Assistant</h3>
            </div>
            
            <div className="flex-grow p-4 flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                >
                    <Bot size={60} className="text-cyan-400/50 mb-4" />
                </motion.div>
                <h4 className="text-xl font-bold text-white mb-2">Coming Soon!</h4>
                <p className="text-gray-400 text-sm">
                    Our AI-powered Hyper Assistant is under development and will be available soon to answer all your questions about the HYPERNODE ecosystem.
                </p>
            </div>

            <div className="p-4 border-t border-cyan-500/30">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Coming soon..."
                  disabled
                  className="w-full bg-black/30 border border-gray-600 rounded-full py-2 pl-4 pr-12 text-white placeholder-gray-500 cursor-not-allowed"
                />
                <button disabled className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cyan-500/50 cursor-not-allowed">
                  <Send size={18} className="text-white/50" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;