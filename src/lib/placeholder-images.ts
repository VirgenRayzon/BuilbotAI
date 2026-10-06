export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = [
  {
    id: "cpu",
    description: "A modern high-performance desktop processor.",
    imageUrl: "/placeholders/components/cpu.jpg",
    imageHint: "cpu processor"
  },
  {
    id: "gpu",
    description: "A high-performance discrete graphics card.",
    imageUrl: "/placeholders/components/gpu.jpg",
    imageHint: "discrete graphics card"
  },
  {
    id: "gpu-integrated",
    description: "Integrated APU graphics processor.",
    imageUrl: "/placeholders/components/gpu-integrated.jpg",
    imageHint: "integrated graphics apu"
  },
  {
    id: "motherboard",
    description: "A premium gaming motherboard.",
    imageUrl: "/placeholders/components/motherboard.jpg",
    imageHint: "motherboard circuit"
  },
  {
    id: "ram",
    description: "High-speed dual-channel DDR5/DDR4 RAM modules.",
    imageUrl: "/placeholders/components/ram.jpg",
    imageHint: "ram memory stick"
  },
  {
    id: "storage",
    description: "A lightning-fast M.2 NVMe SSD.",
    imageUrl: "/placeholders/components/storage.jpg",
    imageHint: "ssd storage nvme"
  },
  {
    id: "psu",
    description: "A reliable modular power supply unit.",
    imageUrl: "/placeholders/components/psu.jpg",
    imageHint: "power supply psu"
  },
  {
    id: "case",
    description: "A sleek modern gaming PC case chassis.",
    imageUrl: "/placeholders/components/case.jpg",
    imageHint: "computer case chassis"
  },
  {
    id: "cooler",
    description: "An efficient high-performance CPU cooler.",
    imageUrl: "/placeholders/components/cooler.jpg",
    imageHint: "cpu cooler heatsink"
  }
];

/**
 * Returns a high-quality, category-specific local placeholder image
 * for computer components when an inventory image is not available.
 */
export function getComponentPlaceholderImage(category?: string, modelOrName?: string): string {
  const cat = (category || "").toLowerCase().trim();
  const name = (modelOrName || "").toLowerCase().trim();

  // Detect integrated vs discrete graphics
  if (
    cat.includes("gpu") || 
    cat.includes("graphic") || 
    cat.includes("video") || 
    cat.includes("vga")
  ) {
    const isIntegrated = 
      name.includes("integrated") ||
      name.includes("uhd") ||
      name.includes("iris") ||
      name.includes("vega") ||
      name.includes("apu") ||
      name.includes("onboard") ||
      name.includes("none") ||
      name.includes("n/a") ||
      (name.includes("radeon") && !name.includes("rx"));
      
    if (isIntegrated) {
      return "/placeholders/components/gpu-integrated.jpg";
    }
    return "/placeholders/components/gpu.jpg";
  }

  if (cat.includes("cpu") || cat.includes("processor")) {
    return "/placeholders/components/cpu.jpg";
  }

  if (cat.includes("motherboard") || cat.includes("mobo") || cat.includes("mainboard")) {
    return "/placeholders/components/motherboard.jpg";
  }

  if (cat.includes("ram") || cat.includes("memory")) {
    return "/placeholders/components/ram.jpg";
  }

  if (
    cat.includes("storage") || 
    cat.includes("ssd") || 
    cat.includes("hdd") || 
    cat.includes("drive") || 
    cat.includes("nvme") || 
    cat.includes("hard")
  ) {
    return "/placeholders/components/storage.jpg";
  }

  if (
    cat.includes("psu") || 
    cat.includes("power") || 
    cat.includes("supply")
  ) {
    return "/placeholders/components/psu.jpg";
  }

  if (
    cat.includes("cooler") || 
    cat.includes("fan") || 
    cat.includes("aio") || 
    cat.includes("liquid") || 
    cat.includes("heatsink")
  ) {
    return "/placeholders/components/cooler.jpg";
  }

  if (
    cat.includes("case") || 
    cat.includes("chassis") || 
    cat.includes("cabinet") || 
    cat.includes("tower")
  ) {
    return "/placeholders/components/case.jpg";
  }

  // Fallback if category didn't match, check model name
  if (name.includes("rtx") || name.includes("gtx") || name.includes("radeon") || name.includes("geforce")) {
    return "/placeholders/components/gpu.jpg";
  }
  if (name.includes("core i") || name.includes("ryzen") || name.includes("intel") || name.includes("amd")) {
    return "/placeholders/components/cpu.jpg";
  }

  return "/placeholders/components/case.jpg";
}
