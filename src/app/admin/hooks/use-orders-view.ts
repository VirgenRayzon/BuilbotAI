"use client";

import { useEffect, useMemo, useState } from 'react';
import { isOrderExpired, isOrderPendingWithNoProgression } from '@/lib/order-expiration';
import {
  getRefundedAmount,
  isOrderReadyForFulfillmentQueue,
} from '@/lib/order-workflow';
import { isSimulatedPaymentMethod } from '@/lib/payment-methods';
import type { Order } from '@/lib/types';
import {
  getEffectiveOrderDisplayStage,
  getTimestampSeconds,
  type OrderRefundFilter,
  type OrderSortOption,
  type OrderUnifiedFilterStage,
} from '../components/orders/order-status-config';

interface UseOrdersViewOptions {
  orders: Order[];
  archived: boolean;
  controlledSearchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  initialStageFilter?: OrderUnifiedFilterStage;
  onStageChange?: (stage: OrderUnifiedFilterStage) => void;
  serverStageCounts?: Record<string, number>;
  serverTotalCount?: number;
}

export function useOrdersView({
  orders,
  archived,
  controlledSearchQuery,
  onSearchQueryChange,
  initialStageFilter = 'all',
  onStageChange,
  serverStageCounts,
  serverTotalCount,
}: UseOrdersViewOptions) {
  const [localStage, setLocalStage] = useState<OrderUnifiedFilterStage>(initialStageFilter);
  const stageFilter = onStageChange ? initialStageFilter : localStage;
  const setStageFilter = (stage: OrderUnifiedFilterStage) => onStageChange ? onStageChange(stage) : setLocalStage(stage);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [refundFilter, setRefundFilter] = useState<OrderRefundFilter>('all');
  const [sortBy, setSortBy] = useState<OrderSortOption>('newest');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const searchQuery = controlledSearchQuery ?? localSearchQuery;
  const setSearchQuery = onSearchQueryChange ?? setLocalSearchQuery;

  const scopedOrders = useMemo(
    () => (orders || []).filter((order) => Boolean(order.isArchived) === archived),
    [orders, archived]
  );

  const summary = useMemo(() => {
    let refundAttention = 0;
    let expiredOnlineHolds = 0;

    for (const order of scopedOrders) {
      if (
        order.refundStatus === 'due' ||
        order.refundStatus === 'pending' ||
        Boolean(order.pendingRefundOperationId)
      ) {
        refundAttention += 1;
      }

      if (
        !archived &&
        isOrderPendingWithNoProgression(order) &&
        isOrderExpired(order.createdAt)
      ) {
        expiredOnlineHolds += 1;
      }
    }

    if (serverStageCounts && Object.keys(serverStageCounts).length > 0) {
      const orderPlaced = serverStageCounts.order_placed ?? serverStageCounts.orderPlaced ?? 0;
      const assemblingTesting = serverStageCounts.assembling_testing ?? serverStageCounts.assemblingTesting ?? serverStageCounts.assembling ?? 0;
      const outForDelivery = serverStageCounts.out_for_delivery ?? serverStageCounts.outForDelivery ?? 0;
      const delivered = serverStageCounts.delivered ?? 0;
      const cancelled = serverStageCounts.cancelled ?? 0;
      const total = serverTotalCount ?? serverStageCounts.total ?? (orderPlaced + assemblingTesting + outForDelivery + delivered + cancelled);

      return {
        total,
        orderPlaced,
        assemblingTesting,
        outForDelivery,
        delivered,
        cancelled,
        refundAttention,
        expiredOnlineHolds,
      };
    }

    let orderPlaced = 0;
    let assemblingTesting = 0;
    let outForDelivery = 0;
    let delivered = 0;
    let cancelled = 0;

    for (const order of scopedOrders) {
      const displayStage = getEffectiveOrderDisplayStage(order);
      if (
        displayStage === 'order_placed' &&
        isOrderReadyForFulfillmentQueue(order)
      ) orderPlaced += 1;
      else if (displayStage === 'assembling_testing') assemblingTesting += 1;
      else if (displayStage === 'out_for_delivery') outForDelivery += 1;
      else if (displayStage === 'delivered') delivered += 1;
      else if (displayStage === 'cancelled') cancelled += 1;
    }

    return {
      total: scopedOrders.length,
      orderPlaced,
      assemblingTesting,
      outForDelivery,
      delivered,
      cancelled,
      refundAttention,
      expiredOnlineHolds,
    };
  }, [scopedOrders, archived, serverStageCounts, serverTotalCount]);

  const filteredOrders = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();

    const matches = scopedOrders.filter((order) => {
      const displayStage = getEffectiveOrderDisplayStage(order);
      if (stageFilter !== 'all' && displayStage !== stageFilter) {
        return false;
      }
      if (
        stageFilter === 'order_placed' &&
        !isOrderReadyForFulfillmentQueue(order)
      ) {
        return false;
      }

      if (paymentStatusFilter !== 'all') {
        const effectivePaymentStatus =
          order.paymentStatus ||
          (isSimulatedPaymentMethod(order.paymentMethod) ? 'pending' : 'unpaid');
        if (effectivePaymentStatus !== paymentStatusFilter) return false;
      }

      if (paymentMethodFilter !== 'all') {
        const effectivePaymentMethod = order.paymentMethod || 'cod';
        if (effectivePaymentMethod !== paymentMethodFilter) return false;
      }

      if (refundFilter !== 'all') {
        const effectiveRefund = order.pendingRefundOperationId
          ? 'pending'
          : order.refundStatus && order.refundStatus !== 'none'
            ? order.refundStatus
            : getRefundedAmount(order) > 0
              ? 'partial'
              : 'none';
        if (effectiveRefund !== refundFilter) return false;
      }

      if (queryText) {
        const emailMatch = order.userEmail?.toLowerCase().includes(queryText);
        const idMatch = order.id?.toLowerCase().includes(queryText);
        const orderNumMatch = order.orderNumber?.toLowerCase().includes(queryText);
        const paymentRefMatch = order.paymentReference?.toLowerCase().includes(queryText);
        const prebuiltMatch = order.prebuiltName?.toLowerCase().includes(queryText);
        const recipientMatch = order.shippingAddress?.fullName
          ?.toLowerCase()
          .includes(queryText);
        const partsMatch = order.items?.some((it) =>
          it.name?.toLowerCase().includes(queryText)
        );
        const refundRefMatch = order.refunds?.some((r) =>
          r.reference?.toLowerCase().includes(queryText)
        );

        if (
          !emailMatch &&
          !idMatch &&
          !orderNumMatch &&
          !paymentRefMatch &&
          !prebuiltMatch &&
          !recipientMatch &&
          !partsMatch &&
          !refundRefMatch
        ) {
          return false;
        }
      }

      return true;
    });

    matches.sort((a, b) => {
      const timeA = getTimestampSeconds(a.createdAt);
      const timeB = getTimestampSeconds(b.createdAt);

      if (sortBy === 'newest') return timeB - timeA;
      if (sortBy === 'oldest') return timeA - timeB;
      if (sortBy === 'price-high') return (b.totalPrice || 0) - (a.totalPrice || 0);
      if (sortBy === 'price-low') return (a.totalPrice || 0) - (b.totalPrice || 0);
      return 0;
    });

    return matches;
  }, [
    scopedOrders,
    stageFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    refundFilter,
    searchQuery,
    sortBy,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    stageFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    refundFilter,
    searchQuery,
    sortBy,
    itemsPerPage,
  ]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const effectivePage = Math.min(currentPage, totalPages);
  useEffect(() => { setCurrentPage(page => Math.min(page, totalPages)); }, [totalPages]);
  const paginatedOrders = useMemo(() => {
    const startIndex = (effectivePage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, effectivePage, itemsPerPage]);

  const activeFilterCount =
    Number(paymentStatusFilter !== 'all') +
    Number(paymentMethodFilter !== 'all') +
    Number(refundFilter !== 'all') +
    Number(sortBy !== 'newest');

  const resetFilters = () => {
    setStageFilter('all');
    setPaymentStatusFilter('all');
    setPaymentMethodFilter('all');
    setRefundFilter('all');
    setSortBy('newest');
  };

  return {
    stageFilter,
    setStageFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    paymentMethodFilter,
    setPaymentMethodFilter,
    refundFilter,
    setRefundFilter,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    currentPage: effectivePage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    summary,
    filteredOrders,
    paginatedOrders,
    totalPages,
    activeFilterCount,
    resetFilters,
  };
}

