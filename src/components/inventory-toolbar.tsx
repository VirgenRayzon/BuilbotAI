'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Group,
  Popover,
  Radio,
  ScrollArea,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
  VisuallyHidden,
} from '@mantine/core';
import {
  Filter,
  LayoutGrid,
  List,
  Search,
  Table as TableIcon,
  X,
} from 'lucide-react';
import { useMediaQuery } from '@mantine/hooks';
import { AdminHeaderSlot } from '@/app/admin/components/admin-tab-header';

export type SortDirection = 'asc' | 'desc';
export type InventoryViewMode = 'grid' | 'list' | 'table';
export type AvailabilityFilter = 'all' | 'in-stock' | 'out-of-stock';

export type Category = {
  name: string;
  selected: boolean;
  icon?: React.ComponentType<{ className?: string }>;
};

export interface InventoryToolbarProps {
  categories: Category[];
  onCategoryChange: (categoryName: string, selected: boolean) => void;
  onClearCategories?: () => void;
  itemCount: number;

  sortBy: string;
  onSortByChange: (value: string) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (value: SortDirection) => void;
  supportedSorts: string[];
  defaultSort?: string;

  view?: InventoryViewMode;
  onViewChange?: (value: any) => void;
  showViewToggle?: boolean;
  supportedViews?: InventoryViewMode[];

  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  searchPlaceholder?: string;

  showDetails?: boolean;
  onShowDetailsChange?: (value: boolean) => void;

  availableBrands?: string[];
  selectedBrands?: string[];
  onBrandChange?: (brands: string[]) => void;

  hideIncompatible?: boolean;
  onHideIncompatibleChange?: (value: boolean) => void;

  availability?: AvailabilityFilter;
  onAvailabilityChange?: (value: AvailabilityFilter) => void;

  categoryLabel?: string;
  itemLabel?: string;
  onResetAll?: () => void;
  leadingActions?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'admin-header';
}

const sortOptionLabelMap: Record<string, { desc: string; asc: string }> = {
  'Date Added': { desc: 'Newest first', asc: 'Oldest first' },
  'Name': { asc: 'Name: A to Z', desc: 'Name: Z to A' },
  'Price': { asc: 'Price: low to high', desc: 'Price: high to low' },
  'Tier': { asc: 'Tier: Entry to Workstation', desc: 'Tier: Workstation to Entry' },
  'Stock': { desc: 'Stock: high to low', asc: 'Stock: low to high' },
  'Brand': { asc: 'Brand: A to Z', desc: 'Brand: Z to A' },
};

export function InventoryToolbar({
  categories,
  onCategoryChange,
  onClearCategories,
  itemCount,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  supportedSorts,
  defaultSort,
  view = 'grid',
  onViewChange,
  showViewToggle = false,
  supportedViews = ['grid', 'list'],
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder = 'Search...',
  showDetails,
  onShowDetailsChange,
  availableBrands = [],
  selectedBrands = [],
  onBrandChange,
  hideIncompatible,
  onHideIncompatibleChange,
  availability,
  onAvailabilityChange,
  categoryLabel = 'Categories',
  itemLabel = 'items',
  onResetAll,
  leadingActions,
  actions,
  variant = 'default',
}: InventoryToolbarProps) {
  const [desktopOpened, setDesktopOpened] = useState(false);
  const [mobileOpened, setMobileOpened] = useState(false);
  const [brandQuery, setBrandQuery] = useState('');
  const isMobile = useMediaQuery('(max-width: 639px)');

  useEffect(() => {
    setDesktopOpened(false);
    setMobileOpened(false);
  }, [isMobile]);

  const filteredBrands = useMemo(() => {
    if (!availableBrands || availableBrands.length === 0) return [];
    const query = brandQuery.trim().toLowerCase();
    return availableBrands.filter((brand) => brand.toLowerCase().includes(query));
  }, [availableBrands, brandQuery]);

  const allCategoriesSelected = categories.length === 0 || categories.every((c) => c.selected);
  const categoriesActive = !allCategoriesSelected;
  const selectedCategoryCount = categories.filter((c) => c.selected).length;
  const selectedCategoryNames = categories.filter((c) => c.selected).map((c) => c.name);

  const brandsActive = selectedBrands.length > 0;
  const availabilityActive = availability !== undefined && availability !== 'all';
  const incompatibleActive = Boolean(hideIncompatible);
  const detailsActive = Boolean(showDetails);

  // Derive sort options
  const sortOptions = useMemo(() => {
    const list: { label: string; value: string }[] = [];
    supportedSorts.forEach((sortName) => {
      const mapping = sortOptionLabelMap[sortName];
      if (mapping) {
        if (sortName === 'Date Added' || sortName === 'Stock') {
          list.push({ label: mapping.desc, value: `${sortName}:desc` });
          list.push({ label: mapping.asc, value: `${sortName}:asc` });
        } else {
          list.push({ label: mapping.asc, value: `${sortName}:asc` });
          list.push({ label: mapping.desc, value: `${sortName}:desc` });
        }
      } else {
        list.push({ label: `${sortName}: A to Z`, value: `${sortName}:asc` });
        list.push({ label: `${sortName}: Z to A`, value: `${sortName}:desc` });
      }
    });
    return list;
  }, [supportedSorts]);

  const fallbackDefaultSort = defaultSort || (supportedSorts.includes('Date Added') ? 'Date Added:desc' : `${supportedSorts[0]}:desc`);
  const sortValue = `${sortBy}:${sortDirection}`;
  const sortActive = sortValue !== fallbackDefaultSort;
  const sortLabel = sortOptions.find((o) => o.value === sortValue)?.label ?? sortBy;

  const activeCount = Number(categoriesActive)
    + Number(brandsActive)
    + Number(availabilityActive)
    + Number(incompatibleActive)
    + Number(detailsActive)
    + Number(sortActive);

  const hasActiveChips = activeCount > 0 || Boolean(searchQuery);

  const handleResetFilters = () => {
    if (onResetAll) {
      onResetAll();
    } else {
      if (categories.length > 0) {
        onCategoryChange('All', true);
      }
      if (onBrandChange) {
        onBrandChange([]);
      }
      if (onAvailabilityChange) {
        onAvailabilityChange('all');
      }
      if (onHideIncompatibleChange) {
        onHideIncompatibleChange(false);
      }
      if (onShowDetailsChange) {
        onShowDetailsChange(false);
      }
      const [defaultBy, defaultDir] = fallbackDefaultSort.split(':') as [string, SortDirection];
      onSortByChange(defaultBy);
      onSortDirectionChange(defaultDir);
      if (onSearchQueryChange) {
        onSearchQueryChange('');
      }
    }
  };

  const isCompactHeader = variant === 'admin-header';

  const filterButton = (mobile: boolean) => (
    <Button
      size={isCompactHeader ? 'sm' : undefined}
      h={isCompactHeader ? 36 : undefined}
      variant={activeCount ? 'light' : 'default'}
      color={activeCount ? 'cyan' : undefined}
      radius="md"
      leftSection={<Filter size={isCompactHeader ? 15 : 17} />}
      rightSection={activeCount ? <Badge color="cyan" circle size={isCompactHeader ? 'xs' : 'sm'}>{activeCount}</Badge> : undefined}
      className={isCompactHeader ? 'whitespace-nowrap' : 'min-h-11 flex-1 whitespace-nowrap sm:flex-none'}
      onClick={mobile ? () => setMobileOpened(true) : undefined}
      aria-expanded={mobile ? mobileOpened : desktopOpened}
      aria-label={`Filters and sort${activeCount ? `, ${activeCount} active` : ''}`}
    >
      Filters & sort
    </Button>
  );

  const filterContent = (close: () => void, maxHeight: string) => (
    <div className="flex flex-col" style={{ maxHeight }}>
      <Stack gap="sm" className="min-h-0 overflow-y-auto p-3">
        {/* Categories / Tiers */}
        {categories.length > 0 && (
          <div>
            <Group justify="space-between" mb={4}>
              <Text fw={700} size="sm">{categoryLabel}</Text>
              <Button
                variant="subtle"
                size="compact-sm"
                className="min-h-11 px-1 sm:min-h-7"
                onClick={() => onCategoryChange('All', true)}
              >
                Select all
              </Button>
            </Group>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0">
              {categories.map((category) => (
                <Checkbox
                  key={category.name}
                  label={category.name}
                  checked={category.selected}
                  onChange={(event) => onCategoryChange(category.name, event.currentTarget.checked)}
                  size="sm"
                  classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }}
                />
              ))}
            </div>
            {categories.length > 1 && (
              <Button
                variant="subtle"
                color="gray"
                size="compact-sm"
                className="min-h-11 px-1 sm:min-h-7"
                mt={2}
                onClick={onClearCategories ? onClearCategories : () => categories.forEach((c) => onCategoryChange(c.name, false))}
              >
                Clear {categoryLabel.toLowerCase()}
              </Button>
            )}
          </div>
        )}

        {/* Brands Section */}
        {availableBrands.length > 0 && onBrandChange && (
          <>
            {categories.length > 0 && <Divider />}
            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={700} size="sm">Brands</Text>
                {brandsActive && (
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    className="min-h-11 px-1 sm:min-h-7"
                    onClick={() => onBrandChange([])}
                  >
                    Clear
                  </Button>
                )}
              </Group>
              <TextInput
                aria-label="Find a brand"
                placeholder="Find a brand"
                value={brandQuery}
                onChange={(event) => setBrandQuery(event.currentTarget.value)}
                size="sm"
                radius="md"
                mb="xs"
              />
              <ScrollArea.Autosize mah={130}>
                <Stack gap={0}>
                  {filteredBrands.map((brand) => (
                    <Checkbox
                      key={brand}
                      label={brand}
                      checked={selectedBrands.includes(brand)}
                      onChange={(event) => onBrandChange(event.currentTarget.checked
                        ? [...selectedBrands, brand]
                        : selectedBrands.filter((selected) => selected !== brand))}
                      size="sm"
                      classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }}
                    />
                  ))}
                  {filteredBrands.length === 0 && <Text size="sm" c="dimmed">No brands found.</Text>}
                </Stack>
              </ScrollArea.Autosize>
            </div>
          </>
        )}

        {/* Availability Section */}
        {onAvailabilityChange && (
          <>
            <Divider />
            <div>
              <Text fw={700} size="sm" mb="xs">Availability</Text>
              <Radio.Group
                value={availability || 'all'}
                onChange={(val) => onAvailabilityChange(val as AvailabilityFilter)}
              >
                <Stack gap={0}>
                  <Radio value="all" label="All parts" color="cyan" size="sm" classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }} />
                  <Radio value="in-stock" label="In stock only" color="cyan" size="sm" classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }} />
                  <Radio value="out-of-stock" label="Out of stock only" color="cyan" size="sm" classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }} />
                </Stack>
              </Radio.Group>
            </div>
          </>
        )}

        {/* Switches */}
        {(onHideIncompatibleChange !== undefined || onShowDetailsChange !== undefined) && (
          <>
            <Divider />
            <Stack gap="xs">
              {onHideIncompatibleChange !== undefined && (
                <Switch
                  label="Hide incompatible parts"
                  description="Use the parts in your current build"
                  checked={Boolean(hideIncompatible)}
                  onChange={(event) => onHideIncompatibleChange(event.currentTarget.checked)}
                  color="cyan"
                />
              )}
              {onShowDetailsChange !== undefined && (
                <Switch
                  label="Show component specs"
                  description="Expand hardware breakdown on cards"
                  checked={Boolean(showDetails)}
                  onChange={(event) => onShowDetailsChange(event.currentTarget.checked)}
                  color="cyan"
                />
              )}
            </Stack>
          </>
        )}

        {/* Sort Radio Group */}
        {sortOptions.length > 0 && (
          <>
            <Divider />
            <div>
              <Text fw={700} size="sm" mb="xs">Sort by</Text>
              <Radio.Group
                value={sortValue}
                onChange={(value) => {
                  const [by, direction] = value.split(':') as [string, SortDirection];
                  onSortByChange(by);
                  onSortDirectionChange(direction);
                }}
              >
                <Stack gap={0}>
                  {sortOptions.map((option) => (
                    <Radio
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      color="cyan"
                      size="sm"
                      classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }}
                    />
                  ))}
                </Stack>
              </Radio.Group>
            </div>
          </>
        )}
      </Stack>

      {/* Popover / Drawer Action Footer */}
      <Group grow className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111722]">
        <Button variant="default" radius="md" className="h-11" onClick={handleResetFilters}>
          Reset all
        </Button>
        <Button color="cyan" radius="md" className="h-11" onClick={close}>
          Show {itemCount} {itemLabel}
        </Button>
      </Group>
    </div>
  );

  const mobileDrawerNode = (
    <Drawer
      opened={mobileOpened}
      onClose={() => setMobileOpened(false)}
      title="Filters & sort"
      position="bottom"
      size="85dvh"
      radius="lg"
      hiddenFrom="sm"
      classNames={{
        content: 'bg-white dark:bg-[#111722] text-slate-900 dark:text-slate-100',
        header: 'p-3 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722]',
        body: '!p-0',
      }}
    >
      {filterContent(() => setMobileOpened(false), 'calc(85dvh - 64px)')}
    </Drawer>
  );

  if (isCompactHeader) {
    const segmentedData = supportedViews.map((mode) => {
      const Icon = mode === 'grid' ? LayoutGrid : mode === 'table' ? TableIcon : List;
      const labelText = mode === 'grid' ? 'Grid view' : mode === 'table' ? 'Table view' : 'List view';
      return {
        value: mode,
        label: (
          <Tooltip label={labelText} withArrow position="top">
            <span className="inline-flex items-center justify-center px-1 py-0.5" aria-label={labelText}>
              <Icon size={15} />
              <VisuallyHidden>{labelText}</VisuallyHidden>
            </span>
          </Tooltip>
        ),
      };
    });

    const headerActions = (
      <>
        {leadingActions}
        <div className="flex sm:hidden">{filterButton(true)}</div>
        <div className="hidden sm:block">
          <Popover opened={desktopOpened} onChange={setDesktopOpened} width={360} position="bottom-end" shadow="lg" withinPortal>
            <Popover.Target>
              <div onClick={() => setDesktopOpened((opened) => !opened)}>{filterButton(false)}</div>
            </Popover.Target>
            <Popover.Dropdown p={0} className="border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#111722]">
              {filterContent(() => setDesktopOpened(false), 'min(78vh, 760px)')}
            </Popover.Dropdown>
          </Popover>
        </div>

        {showViewToggle && view && onViewChange && (
          <SegmentedControl
            size="xs"
            radius="md"
            value={view}
            onChange={(val) => onViewChange(val as InventoryViewMode)}
            data={segmentedData}
            aria-label="Catalog view"
            classNames={{
              root: 'h-9 bg-slate-100 dark:bg-[#141a23] border border-slate-200/80 dark:border-white/10 p-0.5',
              indicator: 'bg-white dark:bg-[#1e2634] shadow-xs',
              label: 'h-full flex items-center justify-center px-2 text-slate-600 dark:text-slate-300 data-[active]:text-cyan-600 dark:data-[active]:text-cyan-400',
            }}
          />
        )}

        {actions}
      </>
    );

    const headerChips = hasActiveChips ? (
      <Group gap="xs" align="center" className="flex-wrap pt-0.5">
        <Text size="xs" c="dimmed" className="font-medium">
          Active filters:
        </Text>
        {categoriesActive && (
          <ActiveChip
            label={
              selectedCategoryCount === 0
                ? `No ${categoryLabel.toLowerCase()}`
                : selectedCategoryCount === 1
                  ? selectedCategoryNames[0]
                  : `${selectedCategoryCount} ${categoryLabel.toLowerCase()}`
            }
            onClick={() => onCategoryChange('All', true)}
          />
        )}
        {brandsActive && (
          <ActiveChip
            label={selectedBrands.length === 1 ? selectedBrands[0] : `${selectedBrands.length} brands`}
            onClick={() => onBrandChange?.([])}
          />
        )}
        {availabilityActive && (
          <ActiveChip
            label={availability === 'in-stock' ? 'In stock only' : 'Out of stock only'}
            onClick={() => onAvailabilityChange?.('all')}
          />
        )}
        {incompatibleActive && (
          <ActiveChip
            label="Compatible only"
            onClick={() => onHideIncompatibleChange?.(false)}
          />
        )}
        {detailsActive && (
          <ActiveChip
            label="Specs expanded"
            onClick={() => onShowDetailsChange?.(false)}
          />
        )}
        {sortActive && (
          <ActiveChip
            label={sortLabel}
            onClick={() => {
              const [defaultBy, defaultDir] = fallbackDefaultSort.split(':') as [string, SortDirection];
              onSortByChange(defaultBy);
              onSortDirectionChange(defaultDir);
            }}
          />
        )}
        {searchQuery && onSearchQueryChange && (
          <ActiveChip
            label={`Search: "${searchQuery}"`}
            onClick={() => onSearchQueryChange('')}
          />
        )}
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          className="min-h-7 text-xs"
          onClick={handleResetFilters}
        >
          Clear all
        </Button>
      </Group>
    ) : null;

    return (
      <>
        <AdminHeaderSlot
          countBadge={
            <Badge
              size="md"
              variant="light"
              color="cyan"
              radius="md"
              className="font-mono font-bold lowercase tracking-normal"
            >
              {itemCount} {itemLabel}
            </Badge>
          }
          actions={headerActions}
          chips={headerChips}
        />
        {mobileDrawerNode}
      </>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {onSearchQueryChange !== undefined && (
          <TextInput
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={searchQuery || ''}
            onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
            leftSection={<Search size={17} className="text-slate-400" />}
            rightSection={searchQuery ? (
              <ActionIcon variant="subtle" color="gray" size={44} aria-label="Clear search" onClick={() => onSearchQueryChange('')}>
                <X size={16} />
              </ActionIcon>
            ) : undefined}
            radius="md"
            className="w-full min-w-0 flex-1 sm:max-w-[560px]"
            classNames={{ input: 'h-11 bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10' }}
          />
        )}

        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <div className="flex flex-1 sm:hidden">{filterButton(true)}</div>
          <div className="hidden sm:block">
            <Popover opened={desktopOpened} onChange={setDesktopOpened} width={360} position="bottom-start" shadow="lg" withinPortal>
              <Popover.Target>
                <div onClick={() => setDesktopOpened((opened) => !opened)}>{filterButton(false)}</div>
              </Popover.Target>
              <Popover.Dropdown p={0} className="border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#111722]">
                {filterContent(() => setDesktopOpened(false), 'min(78vh, 760px)')}
              </Popover.Dropdown>
            </Popover>
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}

          <Text size="sm" c="dimmed" className="hidden whitespace-nowrap sm:block">
            {itemCount} {itemLabel}
          </Text>

          {showViewToggle && view && onViewChange && (
            <Group
              gap={0}
              className="ml-auto overflow-hidden rounded-md border border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722] sm:ml-0"
              role="group"
              aria-label="Catalog view"
            >
              {supportedViews.includes('grid') && (
                <ActionIcon
                  size={44}
                  variant={view === 'grid' ? 'light' : 'subtle'}
                  color="cyan"
                  radius={0}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  onClick={() => onViewChange('grid')}
                >
                  <LayoutGrid size={18} />
                </ActionIcon>
              )}
              {supportedViews.includes('list') && (
                <ActionIcon
                  size={44}
                  variant={view === 'list' ? 'light' : 'subtle'}
                  color="cyan"
                  radius={0}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  onClick={() => onViewChange('list')}
                >
                  <List size={18} />
                </ActionIcon>
              )}
              {supportedViews.includes('table') && (
                <ActionIcon
                  size={44}
                  variant={view === 'table' ? 'light' : 'subtle'}
                  color="cyan"
                  radius={0}
                  aria-label="Table view"
                  aria-pressed={view === 'table'}
                  onClick={() => onViewChange('table')}
                >
                  <TableIcon size={18} />
                </ActionIcon>
              )}
            </Group>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      <Group gap="xs" align="center" className="min-h-6 flex-wrap">
        <Text size="sm" c="dimmed" className="whitespace-nowrap sm:hidden">
          {itemCount} {itemLabel}
        </Text>
        {categoriesActive && (
          <ActiveChip
            label={
              selectedCategoryCount === 0
                ? `No ${categoryLabel.toLowerCase()}`
                : selectedCategoryCount === 1
                  ? selectedCategoryNames[0]
                  : `${selectedCategoryCount} ${categoryLabel.toLowerCase()}`
            }
            onClick={() => onCategoryChange('All', true)}
          />
        )}
        {brandsActive && (
          <ActiveChip
            label={selectedBrands.length === 1 ? selectedBrands[0] : `${selectedBrands.length} brands`}
            onClick={() => onBrandChange?.([])}
          />
        )}
        {availabilityActive && (
          <ActiveChip
            label={availability === 'in-stock' ? 'In stock only' : 'Out of stock only'}
            onClick={() => onAvailabilityChange?.('all')}
          />
        )}
        {incompatibleActive && (
          <ActiveChip
            label="Compatible only"
            onClick={() => onHideIncompatibleChange?.(false)}
          />
        )}
        {detailsActive && (
          <ActiveChip
            label="Specs expanded"
            onClick={() => onShowDetailsChange?.(false)}
          />
        )}
        {sortActive && (
          <ActiveChip
            label={sortLabel}
            onClick={() => {
              const [defaultBy, defaultDir] = fallbackDefaultSort.split(':') as [string, SortDirection];
              onSortByChange(defaultBy);
              onSortDirectionChange(defaultDir);
            }}
          />
        )}
      </Group>

      {/* Mobile Drawer */}
      {mobileDrawerNode}
    </div>
  );
}

function ActiveChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="light"
      color="cyan"
      size="compact-sm"
      radius="md"
      rightSection={<X size={13} />}
      onClick={onClick}
      aria-label={`Remove ${label} filter`}
      className="min-h-11 px-2 py-0 sm:min-h-7"
    >
      {label}
    </Button>
  );
}
