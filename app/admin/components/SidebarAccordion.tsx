"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function SidebarAccordion({
    title,
    icon,
    children,
    defaultOpen = false
}: {
    title: string,
    icon?: React.ReactNode,
    children: React.ReactNode,
    defaultOpen?: boolean
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-3 py-2 rounded-lg font-black text-gray-500 hover:text-gray-200 transition flex items-center justify-between uppercase tracking-wider text-xs mb-1"
            >
                <div className="flex items-center gap-2">
                    {icon} <span>{title}</span>
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {/* Smooth height expansion (optional CSS later, just renders for now) */}
            {isOpen && (
                <div className="space-y-1 pl-2 border-l-2 border-gray-800 ml-5 py-1">
                    {children}
                </div>
            )}
        </div>
    );
}
