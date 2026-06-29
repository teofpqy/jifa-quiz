import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

interface SettingsButtonProps {
  onClick: () => void;
}

export default function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <motion.button
      className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-gray-200/50 text-gray-600 hover:text-[#C41E3A] hover:border-[#C41E3A]/30 transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.3 }}
      title="设置"
    >
      <Settings className="w-5 h-5" />
    </motion.button>
  );
}
