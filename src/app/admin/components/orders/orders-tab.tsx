"use client";
import type { ReconcileRefund } from '@/lib/order-payment';
import type { StaffPaymentRequest } from '@/lib/order-payment';
import type { OrderOperation } from '@/lib/server/order-operations';
import { useOrderActions } from '../../hooks/use-order-actions';
import { OrderStageDialog } from './order-stage-dialog';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { PaginationControls } from '@/components/pagination-controls';
import type { Order, OrderFulfillmentStage, Part, PaymentStatus } from '@/lib/types';
import type { StaffRefundSubmission } from '../../hooks/use-orders';
import { useOrdersView } from '../../hooks/use-orders-view';
import { OrderPaymentDialogs } from './order-payment-dialogs';
import {
  OrderArchiveDeleteModal,
  OrderCancelModal,
  OrderPhysicalReturnModal,
  type OrderAdminActionType,
} from './order-action-modals';
import { OrderCard } from './order-card';
import { OrderHistoryModal } from './order-history-modal';
import { OrdersEmptyState, OrdersHeaderBar } from './orders-header-bar';
import { OrderCardSkeleton } from '@/components/loading/order-card-skeleton';
import type { OrderUnifiedFilterStage } from './order-status-config';

export interface OrdersTabProps {
  orders: Order[];
  ordersLoading: boolean;
  catalogParts?: Part[] | null;
  hasMoreOrders?: boolean;
  onLoadMoreOrders?: () => void;
  stageCounts?: Record<string, number>;
  totalCount?: number;
  archived?: boolean;
  isSuperAdmin: boolean;
  isSweepingExpired?: boolean;
  onReservationAction: (id: string, action: OrderAdminActionType) => Promise<boolean>;
  onUpdateOrder: (id: string, status: Order['status']) => Promise<boolean>;
  onUpdateOrderPaymentStatus?: (
    id: string,
    paymentStatus: PaymentStatus,
    reason?: string,
    request?: StaffPaymentRequest
  ) => Promise<boolean>;
  onUpdateFulfillmentStage?: (id: string, stage: OrderFulfillmentStage, operation: OrderOperation) => Promise<boolean>;
  onRefundOrder?: (id: string, input: StaffRefundSubmission) => Promise<boolean>;
  onReconcileRefund?: ReconcileRefund;
  onConfirmStockReturn?: (orderId: string, notes?: string) => Promise<boolean>;
  onSweepExpiredOrders?: () => Promise<number>;
  onClearAllOrders?: () => Promise<boolean>;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
}

export function OrdersTab({
  orders,
  ordersLoading,
  catalogParts,
  hasMoreOrders = false,
  onLoadMoreOrders,
  stageCounts,
  totalCount,
  archived = false,
  isSuperAdmin,
  isSweepingExpired = false,
  onReservationAction,
  onUpdateOrder,
  onUpdateOrderPaymentStatus,
  onUpdateFulfillmentStage,
  onRefundOrder,
  onReconcileRefund,
  onConfirmStockReturn,
  onSweepExpiredOrders,
  searchQuery: controlledSearchQuery,
  onSearchQueryChange,
}: OrdersTabProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const stageActions = useOrderActions(orders, onUpdateFulfillmentStage);
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [desktopFiltersOpened, setDesktopFiltersOpened] = useState(false);
  const [mobileFiltersOpened, setMobileFiltersOpened] = useState(false);

  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    order: Order;
    action: OrderAdminActionType;
  } | null>(null);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [stockReturnTarget, setStockReturnTarget] = useState<Order | null>(null);
  const [isConfirmingStockReturn, setIsConfirmingStockReturn] = useState(false);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  const [paymentChange, setPaymentChange] = useState<{
    order: Order;
    status: PaymentStatus;
  } | null>(null);

  const urlStage = searchParams.get('stage') as OrderUnifiedFilterStage | null;
  const initialStage = (urlStage && ['all', 'order_placed', 'assembling_testing', 'out_for_delivery', 'delivered', 'cancelled'].includes(urlStage))
    ? urlStage
    : archived ? 'all' : 'order_placed';

  const view = useOrdersView({
    orders,
    archived,
    controlledSearchQuery,
    onSearchQueryChange,
    initialStageFilter: initialStage,
    serverStageCounts: stageCounts,
    serverTotalCount: totalCount,
    onStageChange: stage => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('stage', stage);
      router.push(`${pathname}?${params}`, { scroll: false });
    },
  });

  useEffect(() => {
    setDesktopFiltersOpened(false);
    setMobileFiltersOpened(false);
  }, [isMobile]);

  useEffect(() => {
    const focusOrderId = searchParams.get('orderId');
    if (focusOrderId && orders.some((o) => o.id === focusOrderId)) {
      setDetailsOrderId(focusOrderId);
    }
  }, [searchParams, orders]);

  const detailsOrder = useMemo(
    () => orders.find((o) => o.id === detailsOrderId) || null,
    [orders, detailsOrderId]
  );

  const handleReconcile: ReconcileRefund = async (orderId, reference) => {
    if (!onReconcileRefund) return false;
    setReconcilingId(orderId);
    try {
      return await onReconcileRefund(orderId, reference);
    } finally {
      setReconcilingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <OrdersHeaderBar
        archived={archived}
        view={view}
        desktopFiltersOpened={desktopFiltersOpened}
        onDesktopFiltersChange={setDesktopFiltersOpened}
        mobileFiltersOpened={mobileFiltersOpened}
        onMobileFiltersChange={setMobileFiltersOpened}
        isSweepingExpired={isSweepingExpired}
        onSweepExpiredOrders={onSweepExpiredOrders}
      />

      {ordersLoading ? (
        <div className="space-y-4 w-full" aria-label="Loading customer orders" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <OrderCardSkeleton key={index} />
          ))}
        </div>
      ) : view.paginatedOrders.length > 0 ? (
        <div className="space-y-4 w-full">
            {view.paginatedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                catalogParts={catalogParts}
                archived={archived}
                isSuperAdmin={isSuperAdmin}
                reconcilingId={reconcilingId}
                onOpenHistory={(targetId) => setDetailsOrderId(targetId)}
                onRequestAdminAction={(target, action) => setPendingAction({ order: target, action })}
                onRequestCancel={setCancelTarget}
                onRequestPaymentStatus={(target, status) => setPaymentChange({ order: target, status })}
                onRequestRefund={setRefundOrder}
                onReconcileRefund={onReconcileRefund ? handleReconcile : undefined}
                onUpdateFulfillmentStage={onUpdateFulfillmentStage ? stageActions.begin : undefined}
                onConfirmStockReturn={onConfirmStockReturn ? (target) => setStockReturnTarget(target) : undefined}
              />
            ))}
        </div>
      ) : (
        <OrdersEmptyState
          archived={archived}
          hasFilters={Boolean(view.searchQuery || view.activeFilterCount > 0)}
          onReset={() => {
            view.resetFilters();
            view.setSearchQuery('');
          }}
        />
      )}

      {view.filteredOrders.length > 0 && (
        <PaginationControls
          currentPage={view.currentPage}
          totalPages={view.totalPages}
          itemsPerPage={view.itemsPerPage}
          onPageChange={view.setCurrentPage}
          onItemsPerPageChange={view.setItemsPerPage}
        />
      )}

      {hasMoreOrders && onLoadMoreOrders && (
        <Button variant="subtle" fullWidth className="min-h-11" onClick={onLoadMoreOrders}>
          Load older orders
        </Button>
      )}

      <OrderStageDialog actions={stageActions} />

      <OrderHistoryModal
        order={detailsOrder}
        archived={archived}
        reconciling={Boolean(detailsOrder && reconcilingId === detailsOrder.id)}
        onClose={() => setDetailsOrderId(null)}
        onOpenRefund={onRefundOrder ? (target) => setRefundOrder(target) : undefined}
        onReconcileRefund={onReconcileRefund ? handleReconcile : undefined}
      />

      <OrderArchiveDeleteModal
        pendingAction={pendingAction}
        saving={isSavingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={async () => {
          if (!pendingAction) return;
          setIsSavingAction(true);
          try {
            const ok = await onReservationAction(pendingAction.order.id, pendingAction.action);
            if (ok) setPendingAction(null);
          } finally {
            setIsSavingAction(false);
          }
        }}
      />

      <OrderCancelModal
        order={cancelTarget}
        cancelling={isCancelling}
        onClose={() => setCancelTarget(null)}
        onConfirm={async () => {
          if (!cancelTarget) return;
          setIsCancelling(true);
          try {
            if (await onUpdateOrder(cancelTarget.id, 'cancelled')) setCancelTarget(null);
          } finally {
            setIsCancelling(false);
          }
        }}
      />

      <OrderPhysicalReturnModal
        order={stockReturnTarget}
        confirming={isConfirmingStockReturn}
        onClose={() => setStockReturnTarget(null)}
        onConfirm={async (notes) => {
          if (!stockReturnTarget || !onConfirmStockReturn) return;
          setIsConfirmingStockReturn(true);
          try {
            const ok = await onConfirmStockReturn(stockReturnTarget.id, notes);
            if (ok) setStockReturnTarget(null);
          } finally {
            setIsConfirmingStockReturn(false);
          }
        }}
      />

      <OrderPaymentDialogs refundOrder={refundOrder} refundSubmitting={refundSubmitting}
        setRefundOrder={setRefundOrder} setRefundSubmitting={setRefundSubmitting} onRefundOrder={onRefundOrder}
        paymentChange={paymentChange} setPaymentChange={setPaymentChange}
        onUpdateOrderPaymentStatus={onUpdateOrderPaymentStatus} />

    </div>
  );
}
