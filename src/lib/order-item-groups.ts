import type { Order, OrderItem } from "./types";

export interface OrderItemGroup {
  id?: string;
  name: string;
  type: "custom-build" | "prebuilt" | "additional";
  items: OrderItem[];
  totalPrice: number;
}

const BUILD_CATEGORIES = new Set([
  "MOTHERBOARD",
  "CPU",
  "GPU",
  "RAM",
  "STORAGE",
  "PSU",
  "COOLER",
  "CASE",
  "OPERATING SYSTEM",
  "FANS",
]);

/**
 * Groups an order's items into structured sets:
 * 1. "My Build" for custom PC configurations (with distinct rig instances preserved)
 * 2. Prebuilt Name (e.g., "Archangel 5") for prebuilt rigs
 * 3. "Additional" for loose accessories, extra components, or peripheral parts
 */
export function groupOrderItems(order: {
  items?: OrderItem[];
  type?: string;
  prebuiltName?: string;
}): OrderItemGroup[] {
  const items = order.items || [];
  if (items.length === 0) return [];

  // Check if items already have explicit groupName or buildType
  const hasExplicitGroups = items.some((it) => !!it.groupName || !!it.buildType);

  if (hasExplicitGroups) {
    const groupMap = new Map<
      string,
      { id?: string; name: string; type: "custom-build" | "prebuilt" | "additional"; items: OrderItem[] }
    >();

    for (const item of items) {
      let gName = item.groupName;
      let gType: "custom-build" | "prebuilt" | "additional" = "additional";

      if (!gName) {
        if (item.buildType === "custom-build") {
          gName = "My Build";
          gType = "custom-build";
        } else if (item.buildType === "prebuilt") {
          gName = item.prebuiltName || order.prebuiltName || "Prebuilt";
          gType = "prebuilt";
        } else {
          gName = "Additional";
          gType = "additional";
        }
      } else {
        if (gName === "My Build" || item.buildType === "custom-build") {
          gType = "custom-build";
        } else if (
          gName === "Additional" ||
          item.buildType === "additional" ||
          item.buildType === "part"
        ) {
          gType = "additional";
        } else {
          gType = "prebuilt";
        }
      }

      // Group key: if item has a rigInstanceId, separate by rigInstanceId to preserve multi-rig identity
      const groupKey =
        gType === "custom-build" && item.rigInstanceId
          ? `rig:${item.rigInstanceId}`
          : `${gType}:${gName}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: item.rigInstanceId,
          name: gName,
          type: gType,
          items: [],
        });
      }
      groupMap.get(groupKey)!.items.push(item);
    }

    const groups: OrderItemGroup[] = [];
    const customRigGroups = Array.from(groupMap.values()).filter(
      (v) => v.type === "custom-build"
    );
    let customRigIndex = 0;

    for (const val of groupMap.values()) {
      let displayName = val.name;
      if (val.type === "custom-build") {
        customRigIndex += 1;
        if (customRigGroups.length > 1 && val.name === "My Build") {
          displayName = `My Build #${customRigIndex}`;
        }
      }

      const totalPrice = val.items.reduce(
        (sum, it) => sum + it.price * (it.quantity && it.quantity > 0 ? it.quantity : 1),
        0
      );
      groups.push({
        id: val.id,
        name: displayName,
        type: val.type,
        items: val.items,
        totalPrice,
      });
    }

    // Sort groups so "My Build" or Prebuilt comes first, followed by "Additional"
    groups.sort((a, b) => {
      if (a.type !== "additional" && b.type === "additional") return -1;
      if (a.type === "additional" && b.type !== "additional") return 1;
      return 0;
    });

    return groups;
  }

  // Fallback for legacy orders where groupName is not on item documents:
  // 1) If the order is explicitly a prebuilt system:
  if (order.type === "prebuilt" || order.prebuiltName) {
    const prebuiltTitle = order.prebuiltName || "Prebuilt System";
    const totalPrice = items.reduce(
      (sum, it) => sum + it.price * (it.quantity && it.quantity > 0 ? it.quantity : 1),
      0
    );
    return [
      {
        id: "prebuilt-0",
        name: prebuiltTitle,
        type: "prebuilt",
        items,
        totalPrice,
      },
    ];
  }

  // 2) If the order has items: detect if there's a custom build and/or additional items
  const hasMotherboard = items.some(
    (it) => it.category?.toUpperCase() === "MOTHERBOARD"
  );

  if (hasMotherboard) {
    const mbIndex = items.findIndex(
      (it) => it.category?.toUpperCase() === "MOTHERBOARD"
    );

    const buildItems: OrderItem[] = [];
    const additionalItems: OrderItem[] = [];
    const buildCategoriesSeen = new Set<string>();

    for (let i = 0; i < mbIndex; i++) {
      additionalItems.push(items[i]);
    }

    for (let i = mbIndex; i < items.length; i++) {
      const it = items[i];
      const cat = (it.category || "").toUpperCase();
      if (BUILD_CATEGORIES.has(cat) && !buildCategoriesSeen.has(cat)) {
        buildCategoriesSeen.add(cat);
        buildItems.push(it);
      } else {
        additionalItems.push(it);
      }
    }

    const groups: OrderItemGroup[] = [];
    if (buildItems.length >= 3) {
      groups.push({
        id: "legacy-rig-0",
        name: "My Build",
        type: "custom-build",
        items: buildItems,
        totalPrice: buildItems.reduce(
          (sum, it) => sum + it.price * (it.quantity && it.quantity > 0 ? it.quantity : 1),
          0
        ),
      });
    } else {
      additionalItems.unshift(...buildItems);
    }

    if (additionalItems.length > 0) {
      groups.push({
        id: "legacy-additional-0",
        name: "Additional",
        type: "additional",
        items: additionalItems,
        totalPrice: additionalItems.reduce(
          (sum, it) => sum + it.price * (it.quantity && it.quantity > 0 ? it.quantity : 1),
          0
        ),
      });
    }

    return groups;
  }

  // If order is explicitly custom and has components:
  if (order.type === "custom" && items.length >= 4) {
    return [
      {
        id: "legacy-rig-0",
        name: "My Build",
        type: "custom-build",
        items,
        totalPrice: items.reduce(
          (sum, it) => sum + it.price * (it.quantity && it.quantity > 0 ? it.quantity : 1),
          0
        ),
      },
    ];
  }

  // Otherwise, all items are standalone / additional parts
  return [
    {
      id: "legacy-additional-0",
      name: "Additional",
      type: "additional",
      items,
      totalPrice: items.reduce(
        (sum, it) => sum + it.price * (it.quantity && it.quantity > 0 ? it.quantity : 1),
        0
      ),
    },
  ];
}

/**
 * Generates a concise summary title for a custom rig build when collapsed in an accordion.
 * Example output: "Custom Rig (AMD Ryzen 9 9900X3D, Asus ProArt RTX 5070 Ti, Corsair Vengeance RGB 32GB)"
 */
export function getCustomRigSummary(items: OrderItem[]): string {
  if (!items || items.length === 0) return "Custom Rig";

  const cpu = items.find((i) => i.category?.toUpperCase() === "CPU");
  const gpu =
    items.find((i) => i.category?.toUpperCase() === "GPU" && i.price > 0) ||
    items.find((i) => i.category?.toUpperCase() === "GPU");
  const ram = items.find((i) => {
    const cat = i.category?.toUpperCase();
    return cat === "RAM" || cat === "MEMORY";
  });
  const mobo = items.find((i) => i.category?.toUpperCase() === "MOTHERBOARD");
  const storage = items.find((i) => i.category?.toUpperCase() === "STORAGE");

  const cleanPartName = (name: string): string => {
    return name
      .replace(/\s+Processor\s+with\s+.*$/i, "")
      .replace(/\s+Graphics\s+Card$/i, "")
      .trim();
  };

  const specs: string[] = [];
  if (cpu) specs.push(cleanPartName(cpu.name));
  if (gpu && gpu.id !== "included-integrated-gpu") {
    specs.push(cleanPartName(gpu.name));
  }
  if (ram) specs.push(cleanPartName(ram.name));
  if (specs.length < 2 && mobo) specs.push(cleanPartName(mobo.name));
  if (specs.length < 2 && storage) specs.push(cleanPartName(storage.name));

  if (specs.length === 0) {
    const fallback = items.slice(0, 2).map((i) => cleanPartName(i.name));
    if (fallback.length > 0) {
      return `Custom Rig (${fallback.join(", ")})`;
    }
    return "Custom Rig";
  }

  return `Custom Rig (${specs.join(", ")})`;
}
