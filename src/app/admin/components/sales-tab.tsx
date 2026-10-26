"use client";

import React from 'react';
import { SalesAnalytics } from '@/components/sales-analytics';
import type { Part, PrebuiltSystem, Order } from '@/lib/types';

interface SalesTabProps {
    orders: Order[];
    parts: Part[];
    prebuiltSystems: PrebuiltSystem[];
    activeSubTab?: 'overview' | 'popularity';
}

export function SalesTab({
    orders,
    parts,
    prebuiltSystems,
    activeSubTab = 'overview',
}: SalesTabProps) {
    return (
        <div className="space-y-6">
            <div className="w-full">
                <SalesAnalytics
                    orders={orders || []}
                    parts={parts || []}
                    prebuilts={prebuiltSystems || []}
                    activeSubTab={activeSubTab}
                />
            </div>
        </div>
    );
}
