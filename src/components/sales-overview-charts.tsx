"use client";

import React from 'react';
import { SalesRevenueChart } from './sales-revenue-chart';
import { SalesOrderStatusChart } from './sales-order-status-chart';
import { SalesTierCategoryCharts } from './sales-tier-category-charts';

interface SalesOverviewChartsProps {
  revenueData: Array<{ name: string; revenue: number }>;
  statusData: Array<{ name: string; value: number; color: string }>;
  prebuiltTierData: Array<{ name: string; value: number; color: string }>;
  categoryData: Array<{ name: string; value: number }>;
  timeRange: 'week' | 'month' | 'year';
  onTimeRangeChange: (range: 'week' | 'month' | 'year') => void;
  mounted: boolean;
  isDark: boolean;
}

export function SalesOverviewCharts({
  revenueData,
  statusData,
  prebuiltTierData,
  categoryData,
  timeRange,
  onTimeRangeChange,
  mounted,
  isDark,
}: SalesOverviewChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesRevenueChart
          revenueData={revenueData}
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
          mounted={mounted}
          isDark={isDark}
        />
        <SalesOrderStatusChart
          statusData={statusData}
          mounted={mounted}
          isDark={isDark}
        />
      </div>

      <SalesTierCategoryCharts
        prebuiltTierData={prebuiltTierData}
        categoryData={categoryData}
        mounted={mounted}
        isDark={isDark}
      />
    </div>
  );
}
