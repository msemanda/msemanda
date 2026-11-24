"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    description?: ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    children?: ReactNode;
    footer?: ReactNode;
    className?: string;
}

const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[calc(100vw-2rem)]",
};

export function Modal({ open, onClose, title, description, size = "md", children, footer, className }: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<Element | null>(null);

    useEffect(() => {
        if (!open) return;
        triggerRef.current = document.activeElement;
        panelRef.current?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
            if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
        };
    }, [open, onClose]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/50"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            key="modal-panel"
                            ref={panelRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label={typeof title === "string" ? title : undefined}
                            tabIndex={-1}
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.16 }}
                            className={cn(
                                "pointer-events-auto w-full bg-white rounded-2xl border border-gray-100 shadow-2xl flex flex-col max-h-[85vh]",
                                sizes[size],
                                className
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {(title || description) && (
                                <div className="px-5 py-4 border-b border-gray-50 flex items-start justify-between gap-3 shrink-0">
                                    <div className="min-w-0">
                                        {title && <h2 className="text-sm font-black text-gray-900 tracking-tight">{title}</h2>}
                                        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Close"
                                        className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                            <div className="px-5 py-4 overflow-y-auto">{children}</div>
                            {footer && <ModalFooter>{footer}</ModalFooter>}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

export function ModalFooter({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div className={cn("px-5 py-3 border-t border-gray-50 flex items-center justify-end gap-2 shrink-0", className)}>
            {children}
        </div>
    );
}
