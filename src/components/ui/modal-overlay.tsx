import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { spring } from '@/lib/motion';

interface ModalOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function ModalOverlay({ open, onOpenChange, title, children, className }: ModalOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  
  useBodyScrollLock(open);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-2 sm:items-center sm:p-6" style={{ overscrollBehavior: 'none' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-[rgb(22_18_13/0.34)] backdrop-blur-[12px]"
            onClick={() => onOpenChange(false)}
            // prevent touch events on backdrop from affecting body
            onTouchMove={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
              }
            }}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 24, filter: 'blur(3px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985, y: 18, filter: 'blur(2px)' }}
            transition={reduceMotion ? { duration: 0.14 } : spring.momentum}
            className={cn(
              "surface-frame relative w-full max-w-md rounded-[1rem] flex flex-col overflow-hidden",
              className
            )}
            style={{ maxHeight: '85vh', overscrollBehavior: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <h2 className="text-xl font-bold leading-tight text-[var(--color-ink-950)]">{title}</h2>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-9 h-9 -mr-2 rounded-[var(--radius-control)] inline-flex items-center justify-center text-[var(--color-ink-500)] hover:text-[var(--color-ink-800)] hover:bg-white/60 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
