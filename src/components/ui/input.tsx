// src/components/ui/input.tsx
import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

// Keep the base input minimal so pages can fully control colors/sizing via className
const Input: React.FC<InputProps> = ({ className = "", ...props }) => {
  // Handle mobile Safari double tap issue
  const handleTouchStart = (e: React.TouchEvent<HTMLInputElement>) => {
    // Only apply this fix on touch devices
    if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
      return;
    }
    
    const target = e.currentTarget;
    
    // Only focus if not already focused to prevent interference with normal behavior
    if (document.activeElement !== target) {
      // Prevent the default behavior to avoid conflicts
      e.preventDefault();
      
      // Focus the input on touch start to prevent the double tap requirement on iOS Safari
      target.focus();
    }
  };

  return (
    <input
      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      onTouchStart={handleTouchStart}
      {...props}
    />
  );
};

export { Input };