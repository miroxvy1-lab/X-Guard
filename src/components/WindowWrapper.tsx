import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Maximize2, Minimize2, Move } from 'lucide-react';

interface WindowWrapperProps {
  key?: string | number;
  id: string;
  title: React.ReactNode;
  onClose: () => void;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  activeWindowId: string;
  setActiveWindowId: (id: string) => void;
  children: React.ReactNode;
  className?: string;
  isRtl?: boolean;
}

export default function WindowWrapper({
  id,
  title,
  onClose,
  defaultX = 150,
  defaultY = 100,
  defaultWidth = 450,
  defaultHeight = 350,
  minWidth = 320,
  minHeight = 240,
  activeWindowId,
  setActiveWindowId,
  children,
  className = '',
  isRtl = true,
}: WindowWrapperProps) {
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaxState, setPreMaxState] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, winW: 0, winH: 0 });

  // Handle clicking inside the window to bring it to front
  const handleWindowClick = () => {
    setActiveWindowId(id);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setActiveWindowId(id);
    if (isMaximized) return;

    // Ignore if clicking interactive items inside title bar
    if ((e.target as HTMLElement).closest('.no-drag')) {
      return;
    }

    e.preventDefault();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: position.x,
      winY: position.y,
    };

    const handleDragMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.mouseX;
      const dy = moveEvent.clientY - dragStartRef.current.mouseY;
      
      // Bound dragging to make sure title bar is at least visible
      const newX = Math.max(-100, Math.min(window.innerWidth - 100, dragStartRef.current.winX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 80, dragStartRef.current.winY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveWindowId(id);
    if (isMaximized) return;

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winW: size.width,
      winH: size.height,
    };

    const handleResizeMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - resizeStartRef.current.mouseX;
      const dy = moveEvent.clientY - resizeStartRef.current.mouseY;

      // Handle RTL resizing differently if needed, but standard mouse delta works well
      const newWidth = Math.max(minWidth, resizeStartRef.current.winW + (isRtl ? -dx : dx));
      const newHeight = Math.max(minHeight, resizeStartRef.current.winH + dy);

      // If RTL, dragging left increases width, so we adjust position X as well to anchor right edge
      if (isRtl) {
        const deltaW = newWidth - resizeStartRef.current.winW;
        setPosition(prev => ({ ...prev, x: dragStartRef.current.winX - deltaW }));
      }

      setSize({ width: newWidth, height: newHeight });
    };

    // Store starting position for RTL anchor calculation
    dragStartRef.current = {
      mouseX: 0,
      mouseY: 0,
      winX: position.x,
      winY: position.y,
    };

    const handleResizeEnd = () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      // Restore
      if (preMaxState) {
        setPosition({ x: preMaxState.x, y: preMaxState.y });
        setSize({ width: preMaxState.w, height: preMaxState.h });
      }
      setIsMaximized(false);
    } else {
      // Maximize
      setPreMaxState({ x: position.x, y: position.y, w: size.width, h: size.height });
      setIsMaximized(true);
    }
  };

  const isActive = activeWindowId === id;
  const zIndex = isActive ? 40 : 30;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.88, filter: 'blur(4px)' }}
      transition={{ type: 'spring', damping: 20, stiffness: 220 }}
      onClick={handleWindowClick}
      style={
        isMaximized
          ? {
              position: 'absolute',
              left: 12,
              top: 12,
              width: 'calc(100% - 24px)',
              height: 'calc(100% - 72px)', // leaves room for taskbar
              zIndex,
            }
          : {
              position: 'absolute',
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height,
              zIndex,
            }
      }
      className={`bg-slate-900/95 border-2 ${
        isActive ? 'border-cyan-500/80 shadow-cyan-500/10' : 'border-slate-800 shadow-black/40'
      } rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md select-none transition-all ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Title Bar (Draggable) */}
      <div
        onMouseDown={handleDragStart}
        className={`bg-slate-950 px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-200 select-none cursor-move border-b border-slate-850 ${
          isActive ? 'text-cyan-400' : 'text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <div className="truncate max-w-[200px] sm:max-w-[300px]">{title}</div>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-2 no-drag">
          <button
            onClick={toggleMaximize}
            className="w-5 h-5 rounded hover:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title={isMaximized ? 'کوچک‌نمایی' : 'بزرگ‌نمایی'}
          >
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-[10px] text-slate-400 transition cursor-pointer font-black"
            title="بستن پنجره"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Container (Scrollable) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 select-text">
        {children}
      </div>

      {/* Resize handle (Bottom corners) */}
      {!isMaximized && (
        <>
          {/* Bottom-Right Handle */}
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end p-0.5"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-slate-600 fill-current opacity-60">
              <line x1="6" y1="0" x2="6" y2="6" stroke="currentColor" strokeWidth="1" />
              <line x1="0" y1="6" x2="6" y2="6" stroke="currentColor" strokeWidth="1" />
              <line x1="3" y1="3" x2="3" y2="3" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>
          {/* Bottom-Left Handle */}
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50"
          />
        </>
      )}
    </motion.div>
  );
}
