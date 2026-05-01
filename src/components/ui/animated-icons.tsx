"use client";

import React from "react";
import { motion, Variants, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { 
  BrainCircuit, 
  Activity, 
  Send, 
  RotateCcw, 
  PlusCircle, 
  MessageSquare, 
  X,
  Bot,
  User,
  Zap,
  ShieldCheck,
  Loader2,
  RectangleVertical as CaseIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedIconProps {
  className?: string;
  size?: number;
  active?: boolean;
}

export const AnimatedBrainIcon = ({ className, size = 24, active }: AnimatedIconProps) => {
  return (
    <motion.div
      animate={active ? {
        scale: [1, 1.1, 1],
        opacity: [0.8, 1, 0.8],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn("relative flex items-center justify-center", className)}
    >
      <BrainCircuit size={size} />
      <motion.div
        animate={active ? {
          scale: [1, 1.5],
          opacity: [0.5, 0],
        } : { opacity: 0 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeOut"
        }}
        className="absolute inset-0 bg-cyan-400/20 rounded-full blur-md"
      />
    </motion.div>
  );
};

export const AnimatedActivityIcon = ({ className, size = 24, active }: AnimatedIconProps) => {
  return (
    <motion.div
      animate={active ? {
        y: [0, -2, 0, 2, 0],
      } : {}}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        ease: "linear"
      }}
      className={cn("relative", className)}
    >
      <Activity size={size} />
    </motion.div>
  );
};

export const AnimatedMessageIcon = ({ className, size = 24, active }: AnimatedIconProps) => {
  return (
    <motion.div
      animate={active ? {
        rotate: [0, -10, 10, -10, 0],
        scale: [1, 1.1, 1],
      } : {}}
      transition={{
        duration: 0.5,
        repeat: active ? Infinity : 0,
        repeatDelay: 1
      }}
      className={cn("relative", className)}
    >
      <MessageSquare size={size} />
    </motion.div>
  );
};

export const AnimatedSendIcon = ({ className, size = 20, active }: AnimatedIconProps) => {
  return (
    <motion.div
      animate={active ? {
        x: [0, 5, 0],
        y: [0, -5, 0],
        scale: [1, 1.2, 1],
      } : {}}
      transition={{
        duration: 0.4,
        ease: "backOut"
      }}
      className={cn("relative", className)}
    >
      <Send size={size} />
    </motion.div>
  );
};

export const AnimatedXIcon = ({ className, size = 20, active }: AnimatedIconProps) => {
  return (
    <motion.div
      animate={active ? {
        rotate: 90,
        scale: 0.8,
      } : {
        rotate: 0,
        scale: 1,
      }}
      className={cn("relative", className)}
    >
      <X size={size} />
    </motion.div>
  );
};

export const AnimatedRotateIcon = ({ className, size = 16, active }: AnimatedIconProps) => {
  return (
    <motion.div
      animate={active ? {
        rotate: -360,
      } : {}}
      transition={{
        duration: 0.6,
        ease: "easeInOut"
      }}
      className={cn("relative", className)}
    >
      <RotateCcw size={size} />
    </motion.div>
  );
};

export const AnimatedShieldIcon = ({ className, size = 20, active }: AnimatedIconProps) => {
  return (
    <motion.div
      animate={active ? {
        scale: [1, 1.1, 1],
        rotateY: [0, 180, 360],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: active ? Infinity : 0,
        ease: "easeInOut"
      }}
      className={cn("relative", className)}
    >
      <ShieldCheck size={size} />
    </motion.div>
  );
};

export const AnimatedCaseIcon = ({ className, size = 20, active }: AnimatedIconProps) => {
  return (
    <motion.div
      animate={active ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: 0.8,
        repeat: active ? Infinity : 0,
        ease: "easeInOut"
      }}
      className={cn("relative", className)}
    >
      <CaseIcon size={size} />
      {active && (
        <motion.div
          layoutId="case-glow"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.2 }}
          exit={{ opacity: 0, scale: 1.4 }}
          className="absolute inset-0 bg-primary/20 rounded-full blur-xl -z-10"
        />
      )}
    </motion.div>
  );
};

export const AnimatedBotIcon = ({ className, size = 24, active }: AnimatedIconProps) => {
  return (
    <motion.div
      animate={active ? {
        y: [0, -3, 0],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn("relative", className)}
    >
      <Bot size={size} />
      {active && (
        <motion.div
          animate={{
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
          className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full blur-[2px]"
        />
      )}
    </motion.div>
  );
};

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  glowColor?: string;
  isExpanded?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const AnimatedIconButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ icon, activeIcon, label, variant = 'primary', glowColor = 'rgba(6, 182, 212, 0.5)', isExpanded, isLoading, children, className, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white border-white/20";
        case 'secondary':
          return "bg-slate-900/60 backdrop-blur-md text-cyan-400 border-cyan-500/30";
        case 'destructive':
          return "bg-red-600 text-white border-white/10";
        case 'ghost':
          return "bg-transparent text-zinc-400 hover:text-white border-transparent hover:bg-white/5";
        case 'outline':
          return "bg-transparent text-primary border-primary/30 hover:border-primary/60 hover:bg-primary/5";
        default:
          return "";
      }
    };

    return (
      <motion.button
        ref={ref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center justify-center rounded-xl border shadow-2xl transition-all duration-300 overflow-hidden px-4 h-10 disabled:opacity-50 disabled:cursor-not-allowed",
          getVariantClasses(),
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {/* Animated Background Glow */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`
              }}
            />
          )}
        </AnimatePresence>

        {/* Shimmer Effect */}
        <motion.div
          animate={isHovered ? {
            x: ['-100%', '200%'],
          } : { x: '-100%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
        />

        <div className={cn("relative z-10 flex items-center justify-center lg:gap-2 gap-2 w-full")}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          ) : (
            icon && React.isValidElement(icon) && typeof icon.type !== 'string' 
              ? React.cloneElement(icon as React.ReactElement<any>, { active: isHovered }) 
              : icon
          )}
          {children ? (
             typeof children === 'string' || typeof children === 'number' ? (
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  {children}
                </span>
             ) : children
          ) : label && (
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              {label}
            </span>
          )}
        </div>
      </motion.button>
    );
  }
);

AnimatedIconButton.displayName = "AnimatedIconButton";
