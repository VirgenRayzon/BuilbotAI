'use client';

import { useEffect, useState } from 'react';
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
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { Filter, LayoutGrid, List, Search, X } from 'lucide-react';
import { useMediaQuery } from '@mantine/hooks';

type SortDirection = 'asc' | 'desc';
type CatalogView = 'grid' | 'list';

const sortOptions = [
  { label: 'Newest first', value: 'Date Added:desc' },
  { label: 'Oldest first', value: 'Date Added:asc' },
  { label: 'Name: A to Z', value: 'Name:asc' },
  { label: 'Name: Z to A', value: 'Name:desc' },
  { label: 'Price: low to high', value: 'Price:asc' },
  { label: 'Price: high to low', value: 'Price:desc' },
];

interface PublicPartsToolbarProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (name: string, selected: boolean) => void;
  onClearCategories: () => void;
  brands: string[];
  selectedBrands: string[];
  onBrandChange: (brands: string[]) => void;
  hideIncompatible: boolean;
  onHideIncompatibleChange: (value: boolean) => void;
  hideOutOfStock: boolean;
  onHideOutOfStockChange: (value: boolean) => void;
  sortBy: string;
  sortDirection: SortDirection;
  onSortChange: (by: string, direction: SortDirection) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  view: CatalogView;
  onViewChange: (value: CatalogView) => void;
  itemCount: number;
  onResetAll: () => void;
}

export function PublicPartsToolbar(props: PublicPartsToolbarProps) {
  const [desktopOpened, setDesktopOpened] = useState(false);
  const [mobileOpened, setMobileOpened] = useState(false);
  const [brandQuery, setBrandQuery] = useState('');
  const isMobile = useMediaQuery('(max-width: 639px)');

  useEffect(() => {
    setDesktopOpened(false);
    setMobileOpened(false);
  }, [isMobile]);
  const filteredBrands = props.brands.filter((brand) => brand.toLowerCase().includes(brandQuery.trim().toLowerCase()));
  const categoriesActive = props.selectedCategories.length !== props.categories.length;
  const brandsActive = props.selectedBrands.length > 0;
  const sortValue = `${props.sortBy}:${props.sortDirection}`;
  const sortActive = sortValue !== 'Date Added:desc';
  const activeCount = Number(categoriesActive)
    + Number(brandsActive)
    + Number(props.hideIncompatible)
    + Number(props.hideOutOfStock)
    + Number(sortActive);
  const sortLabel = sortOptions.find((option) => option.value === sortValue)?.label ?? 'Newest first';

  const filterButton = (mobile: boolean) => (
    <Button
      variant={activeCount ? 'light' : 'default'}
      color={activeCount ? 'cyan' : undefined}
      radius="md"
      leftSection={<Filter size={17} />}
      rightSection={activeCount ? <Badge color="cyan" circle size="sm">{activeCount}</Badge> : undefined}
      className="min-h-11 flex-1 whitespace-nowrap sm:flex-none"
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
      <div>
        <Group justify="space-between" mb={4}>
          <Text fw={700} size="sm">Categories</Text>
          <Button variant="subtle" size="compact-sm" className="min-h-11 px-1 sm:min-h-7" onClick={() => props.onCategoryChange('All', true)}>Select all</Button>
        </Group>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {props.categories.map((category) => (
            <Checkbox
              key={category}
              label={category}
              checked={props.selectedCategories.includes(category)}
              onChange={(event) => props.onCategoryChange(category, event.currentTarget.checked)}
              size="sm"
              classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }}
            />
          ))}
        </div>
        {props.categories.length > 1 && (
          <Button variant="subtle" color="gray" size="compact-sm" className="min-h-11 px-1 sm:min-h-7" mt={2} onClick={props.onClearCategories}>Clear categories</Button>
        )}
      </div>

      <Divider />
      <div>
        <Group justify="space-between" mb="xs">
          <Text fw={700} size="sm">Brands</Text>
          {brandsActive && <Button variant="subtle" size="compact-sm" className="min-h-11 px-1 sm:min-h-7" onClick={() => props.onBrandChange([])}>Clear</Button>}
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
                checked={props.selectedBrands.includes(brand)}
                onChange={(event) => props.onBrandChange(event.currentTarget.checked
                  ? [...props.selectedBrands, brand]
                  : props.selectedBrands.filter((selected) => selected !== brand))}
                size="sm"
                classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }}
              />
            ))}
            {filteredBrands.length === 0 && <Text size="sm" c="dimmed">No brands found.</Text>}
          </Stack>
        </ScrollArea.Autosize>
      </div>

      <Divider />
      <Stack gap="xs">
        <Switch
          label="Hide incompatible parts"
          description="Use the parts in your current build"
          checked={props.hideIncompatible}
          onChange={(event) => props.onHideIncompatibleChange(event.currentTarget.checked)}
          color="cyan"
        />
        <Switch
          label="Hide out of stock"
          checked={props.hideOutOfStock}
          onChange={(event) => props.onHideOutOfStockChange(event.currentTarget.checked)}
          color="cyan"
        />
      </Stack>

      <Divider />
      <div>
        <Text fw={700} size="sm" mb="xs">Sort by</Text>
        <Radio.Group value={sortValue} onChange={(value) => {
          const [by, direction] = value.split(':') as [string, SortDirection];
          props.onSortChange(by, direction);
        }}>
          <Stack gap={0}>
            {sortOptions.map((option) => <Radio key={option.value} value={option.value} label={option.label} color="cyan" size="sm" classNames={{ root: 'flex min-h-11 items-center sm:min-h-7' }} />)}
          </Stack>
        </Radio.Group>
        <Text size="xs" c="dimmed" mt="xs">Available parts appear first in every sort.</Text>
      </div>

      </Stack>
      <Group grow className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111722]">
        <Button variant="default" radius="md" className="h-11" onClick={props.onResetAll}>Reset all</Button>
        <Button color="cyan" radius="md" className="h-11" onClick={close}>Show {props.itemCount} parts</Button>
      </Group>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <TextInput
          aria-label="Search parts by name, brand, SKU, or product ID"
          placeholder="Search parts..."
          value={props.searchQuery}
          onChange={(event) => props.onSearchQueryChange(event.currentTarget.value)}
          leftSection={<Search size={17} className="text-slate-400" />}
          rightSection={props.searchQuery ? (
            <ActionIcon variant="subtle" color="gray" size={44} aria-label="Clear search" onClick={() => props.onSearchQueryChange('')}>
              <X size={16} />
            </ActionIcon>
          ) : undefined}
          radius="md"
          className="w-full min-w-0 flex-1 sm:max-w-[560px]"
          classNames={{ input: 'h-11 bg-white/85 dark:bg-[#111722] border-slate-200 dark:border-white/10' }}
        />

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

          <Text size="sm" c="dimmed" className="hidden whitespace-nowrap sm:block">{props.itemCount} parts</Text>

          <Group gap={0} className="ml-auto overflow-hidden rounded-md border border-slate-200 bg-white/85 dark:border-white/10 dark:bg-[#111722] sm:ml-0" role="group" aria-label="Catalog view">
            <ActionIcon size={44} variant={props.view === 'grid' ? 'light' : 'subtle'} color="cyan" radius={0} aria-label="Grid view" aria-pressed={props.view === 'grid'} onClick={() => props.onViewChange('grid')}><LayoutGrid size={18} /></ActionIcon>
            <ActionIcon size={44} variant={props.view === 'list' ? 'light' : 'subtle'} color="cyan" radius={0} aria-label="List view" aria-pressed={props.view === 'list'} onClick={() => props.onViewChange('list')}><List size={18} /></ActionIcon>
          </Group>
        </div>
      </div>

      <Group gap="xs" align="center" className="min-h-6">
        <Text size="sm" c="dimmed" className="whitespace-nowrap sm:hidden">{props.itemCount} parts</Text>
        {categoriesActive && <ActiveChip label={props.selectedCategories.length === 0 ? 'No categories' : props.selectedCategories.length === 1 ? props.selectedCategories[0] : `${props.selectedCategories.length} categories`} onClick={() => props.onCategoryChange('All', true)} />}
        {brandsActive && <ActiveChip label={props.selectedBrands.length === 1 ? props.selectedBrands[0] : `${props.selectedBrands.length} brands`} onClick={() => props.onBrandChange([])} />}
        {props.hideIncompatible && <ActiveChip label="Compatible only" onClick={() => props.onHideIncompatibleChange(false)} />}
        {props.hideOutOfStock && <ActiveChip label="In stock only" onClick={() => props.onHideOutOfStockChange(false)} />}
        {sortActive && <ActiveChip label={sortLabel} onClick={() => props.onSortChange('Date Added', 'desc')} />}
      </Group>

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
    </div>
  );
}

function ActiveChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="light" color="cyan" size="compact-sm" radius="md" rightSection={<X size={13} />} onClick={onClick} aria-label={`Remove ${label} filter`} className="min-h-11 px-2 py-0 sm:min-h-7">
      {label}
    </Button>
  );
}
