'use client';

import { ActionIcon, Radio, Stack, Text, Tooltip } from '@mantine/core';
import { Download, RefreshCw } from 'lucide-react';
import { InventoryToolbar, type SortDirection } from '@/components/inventory-toolbar';
import {
  useManagementPortal,
  type PortalSortBy,
  type PortalStatusFilter,
  type PortalViewMode,
} from '@/hooks/use-management-portal';
import { PortalTopControlsBar } from '@/components/management-portal/portal-top-controls-bar';
import { AccountDirectoryList } from '@/components/management-portal/account-directory-list';
import { AccountInspectorModal } from '@/components/management-portal/account-inspector-modal';
import { AccountPurgeModal } from '@/components/management-portal/account-purge-modal';

interface SuperAdminSettingsProps {
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
}

export function SuperAdminSettings({
  searchQuery,
  onSearchQueryChange,
}: SuperAdminSettingsProps) {
  const portal = useManagementPortal({ searchQuery, onSearchQueryChange });

  return (
    <Stack gap="lg" className="w-full">
      <InventoryToolbar
        variant="admin-header"
        categories={portal.roleCategories}
        onCategoryChange={portal.handleRoleCategoryChange}
        onClearCategories={portal.clearRoleCategories}
        itemCount={portal.filteredAccounts.length}
        itemLabel={portal.filteredAccounts.length === 1 ? 'account' : 'accounts'}
        categoryLabel="Account Roles"
        searchQuery={portal.searchQuery}
        onSearchQueryChange={portal.setSearchQuery}
        sortBy={portal.sortBy}
        onSortByChange={(val) => portal.setSortBy(val as PortalSortBy)}
        sortDirection={portal.sortDirection}
        onSortDirectionChange={(val: SortDirection) => portal.setSortDirection(val)}
        supportedSorts={['Date Added', 'Orders', 'Total Spend', 'Email']}
        defaultSort="Date Added:desc"
        view={portal.viewMode}
        onViewChange={(val: PortalViewMode) => portal.setViewMode(val)}
        showViewToggle={true}
        supportedViews={['grid', 'table']}
        onResetAll={portal.resetAllFilters}
        extraActiveCount={portal.statusFilter !== 'all' ? 1 : 0}
        extraFilterContent={
          <div>
            <Text fw={700} size="sm" mb="xs">
              Account Status
            </Text>
            <Radio.Group
              value={portal.statusFilter}
              onChange={(val) => portal.setStatusFilter(val as PortalStatusFilter)}
            >
              <Stack gap={0}>
                <Radio
                  value="all"
                  label="All accounts"
                  color="cyan"
                  size="sm"
                  classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }}
                />
                <Radio
                  value="active"
                  label="Active only"
                  color="cyan"
                  size="sm"
                  classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }}
                />
                <Radio
                  value="suspended"
                  label="Suspended only"
                  color="cyan"
                  size="sm"
                  classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }}
                />
              </Stack>
            </Radio.Group>
          </div>
        }
        leadingActions={
          <>
            <Tooltip label="Export directory to Excel" withArrow position="top">
              <ActionIcon
                variant="default"
                radius="md"
                size={36}
                aria-label="Export directory to Excel"
                onClick={portal.handleExportAccounts}
                disabled={portal.accountsLoading || portal.filteredAccounts.length === 0}
              >
                <Download size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Refresh accounts" withArrow position="top">
              <ActionIcon
                variant="default"
                radius="md"
                size={36}
                aria-label="Refresh accounts"
                onClick={portal.refreshAccounts}
                loading={portal.accountsLoading}
              >
                <RefreshCw size={16} />
              </ActionIcon>
            </Tooltip>
          </>
        }
      />

      <PortalTopControlsBar
        counts={portal.counts}
        managerKey={portal.managerKey}
        onManagerKeyChange={portal.setManagerKey}
        originalManagerDocId={portal.originalManagerDocId}
        savingKey={portal.savingKey}
        keyLoading={portal.keyLoading}
        onSaveDefaultKey={portal.handleSaveDefaultManagerKey}
        requests={portal.requests}
        accounts={portal.accounts}
        actionLoadingId={portal.actionLoadingId}
        onApproveRequest={portal.handleApproveRequest}
        onRejectRequest={portal.handleRejectRequest}
      />

      <AccountDirectoryList
        accounts={portal.paginatedAccounts}
        loading={portal.accountsLoading}
        viewMode={portal.viewMode}
        page={portal.page}
        totalPages={portal.totalPages}
        onPageChange={portal.setPage}
        actionLoadingId={portal.actionLoadingId}
        onInspect={portal.openInspector}
        onResetKey={portal.handleResetManagerKey}
        onToggleRole={portal.handleToggleRole}
        onToggleSuspension={portal.handleToggleSuspension}
        onRevokeSessions={portal.handleRevokeSessions}
        onPurge={portal.openPurgeModal}
      />

      <AccountInspectorModal
        opened={Boolean(portal.inspectTarget)}
        target={portal.inspectTarget}
        details={portal.inspectionDetails}
        loading={portal.inspectLoading}
        actionLoadingId={portal.actionLoadingId}
        onClose={portal.closeInspector}
        onResetKey={portal.handleResetManagerKey}
        onToggleRole={portal.handleToggleRole}
        onToggleSuspension={portal.handleToggleSuspension}
        onRevokeSessions={portal.handleRevokeSessions}
        onRequestPurge={portal.openPurgeModal}
      />

      <AccountPurgeModal
        opened={Boolean(portal.purgeTarget)}
        target={portal.purgeTarget}
        preview={portal.purgePreview}
        previewLoading={portal.purgePreviewLoading}
        purging={portal.purging}
        onClose={portal.closePurgeModal}
        onConfirm={portal.confirmPurge}
      />
    </Stack>
  );
}
