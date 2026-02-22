
import { addDoc, collection, deleteDoc, doc, Firestore, writeBatch } from "firebase/firestore";
import type { AddPartFormSchema } from "@/components/add-part-dialog";
import type { AddPrebuiltFormSchema } from "@/components/add-prebuilt-dialog";
import type { Part, PrebuiltSystem } from "@/lib/types";

const parts: Omit<Part, 'id'>[] = [
  // CPUs
  {
    name: 'AMD Ryzen 5 5600X',
    category: 'CPU',
    brand: 'AMD',
    price: 9800,
    stock: 25,
    imageUrl: 'https://picsum.photos/seed/ryzen55600x/800/600',
    specifications: [
      { key: 'Cores', value: '6' },
      { key: 'Threads', value: '12' },
      { key: 'Socket', value: 'AM4' },
      { key: 'Max Boost Clock', value: '4.6GHz' },
    ],
  },
  {
    name: 'Intel Core i5-13600K',
    category: 'CPU',
    brand: 'Intel',
    price: 18500,
    stock: 18,
    imageUrl: 'https://picsum.photos/seed/i513600k/800/600',
    specifications: [
      { key: 'Cores', value: '14 (6P + 8E)' },
      { key: 'Threads', value: '20' },
      { key: 'Socket', value: 'LGA1700' },
      { key: 'Max Turbo Frequency', value: '5.1GHz' },
    ],
  },
  {
    name: 'AMD Ryzen 7 7800X3D',
    category: 'CPU',
    brand: 'AMD',
    price: 24500,
    stock: 12,
    imageUrl: 'https://picsum.photos/seed/ryzen77800x3d/800/600',
    specifications: [
      { key: 'Cores', value: '8' },
      { key: 'Threads', value: '16' },
      { key: 'Socket', value: 'AM5' },
      { key: 'Max Boost Clock', value: '5.0GHz' },
    ],
  },

  // GPUs
  {
    name: 'NVIDIA GeForce RTX 3060',
    category: 'GPU',
    brand: 'NVIDIA',
    price: 18000,
    stock: 20,
    imageUrl: 'https://picsum.photos/seed/rtx3060/800/600',
    specifications: [
      { key: 'Memory', value: '12GB GDDR6' },
      { key: 'CUDA Cores', value: '3584' },
      { key: 'Boost Clock', value: '1.78 GHz' },
    ],
  },
  {
    name: 'AMD Radeon RX 7800 XT',
    category: 'GPU',
    brand: 'AMD',
    price: 31000,
    stock: 15,
    imageUrl: 'https://picsum.photos/seed/rx7800xt/800/600',
    specifications: [
      { key: 'Memory', value: '16GB GDDR6' },
      { key: 'Stream Processors', value: '3840' },
      { key: 'Game Clock', value: '2124 MHz' },
    ],
  },
  {
    name: 'NVIDIA GeForce RTX 4070 Super',
    category: 'GPU',
    brand: 'NVIDIA',
    price: 40000,
    stock: 10,
    imageUrl: 'https://picsum.photos/seed/rtx4070super/800/600',
    specifications: [
      { key: 'Memory', value: '12GB GDDR6X' },
      { key: 'CUDA Cores', value: '7168' },
      { key: 'Boost Clock', value: '2.48 GHz' },
    ],
  },

  // Motherboards
  {
    name: 'ASUS TUF Gaming B550M-PLUS',
    category: 'Motherboard',
    brand: 'ASUS',
    price: 7500,
    stock: 22,
    imageUrl: 'https://picsum.photos/seed/b550mplus/800/600',
    specifications: [
      { key: 'Socket', value: 'AM4' },
      { key: 'Form Factor', value: 'Micro-ATX' },
      { key: 'Chipset', value: 'B550' },
      { key: 'Memory Slots', value: '4' },
    ],
  },
  {
    name: 'Gigabyte B760M AORUS ELITE AX',
    category: 'Motherboard',
    brand: 'Gigabyte',
    price: 11000,
    stock: 17,
    imageUrl: 'https://picsum.photos/seed/b760maoruselite/800/600',
    specifications: [
      { key: 'Socket', value: 'LGA1700' },
      { key: 'Form Factor', value: 'Micro-ATX' },
      { key: 'Chipset', value: 'B760' },
      { key: 'Memory Type', value: 'DDR5' },
    ],
  },

  // RAM
  {
    name: 'Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz',
    category: 'RAM',
    brand: 'Corsair',
    price: 2800,
    stock: 30,
    imageUrl: 'https://picsum.photos/seed/corsairlpx16gb/800/600',
    specifications: [
      { key: 'Type', value: 'DDR4' },
      { key: 'Capacity', value: '16GB (2x8GB)' },
      { key: 'Speed', value: '3200MHz' },
    ],
  },
  {
    name: 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000MHz',
    category: 'RAM',
    brand: 'G.Skill',
    price: 7200,
    stock: 15,
    imageUrl: 'https://picsum.photos/seed/tridentz532gb/800/600',
    specifications: [
      { key: 'Type', value: 'DDR5' },
      { key: 'Capacity', value: '32GB (2x16GB)' },
      { key: 'Speed', value: '6000MHz' },
    ],
  },
];

const prebuiltSystems: Omit<PrebuiltSystem, 'id'>[] = [
  {
    name: 'The Vanguard',
    tier: 'Entry',
    price: 45000,
    description: 'A solid entry-point for 1080p gaming and everyday productivity. Great value for the price.',
    imageUrl: 'https://picsum.photos/seed/thevanguard/800/600',
    components: {
      cpu: 'AMD Ryzen 5 5600X',
      gpu: 'NVIDIA GeForce RTX 3060',
      motherboard: 'ASUS TUF Gaming B550M-PLUS',
      ram: 'Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz',
    },
  },
  {
    name: 'The Colossus',
    tier: 'Mid-Range',
    price: 85000,
    description: 'Perfect for high-refresh rate 1080p/1440p gaming and content creation without breaking the bank.',
    imageUrl: 'https://picsum.photos/seed/thecolossus/800/600',
    components: {
      cpu: 'Intel Core i5-13600K',
      gpu: 'AMD Radeon RX 7800 XT',
      motherboard: 'Gigabyte B760M AORUS ELITE AX',
      ram: 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000MHz',
    },
  },
  {
    name: 'The Apex',
    tier: 'High-End',
    price: 150000,
    description: 'Experience top-tier performance with this build, capable of handling 4K gaming and heavy creative workloads with ease.',
    imageUrl: 'https://picsum.photos/seed/theapex/800/600',
    components: {
      cpu: 'AMD Ryzen 7 7800X3D',
      gpu: 'NVIDIA GeForce RTX 4070 Super',
      ram: 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000MHz',
    },
  },
];

// Parts
export async function addPart(firestore: Firestore, part: AddPartFormSchema) {
    const partData: Omit<Part, 'id'> = {
        name: part.partName,
        category: part.category as Part['category'],
        brand: part.brand,
        price: part.price,
        stock: part.stockCount,
        imageUrl: part.imageUrl || `https://picsum.photos/seed/${part.partName.replace(/\s+/g, '').toLowerCase()}/800/600`,
        specifications: part.specifications
    };
    await addDoc(collection(firestore, 'pcParts'), partData);
}

export async function deletePart(firestore: Firestore, partId: string) {
    await deleteDoc(doc(firestore, 'pcParts', partId));
}

// Prebuilt Systems
export async function addPrebuiltSystem(firestore: Firestore, system: AddPrebuiltFormSchema) {
    const { name, tier, description, price, imageUrl, cpu, gpu, motherboard, ram, storage, psu, case: caseComponent, cooler } = system;
    
    const systemData: Omit<PrebuiltSystem, 'id'> = {
        name,
        tier: tier as PrebuiltSystem['tier'],
        description,
        price,
        imageUrl: imageUrl || `https://picsum.photos/seed/${name.replace(/\s+/g, '').toLowerCase()}/800/600`,
        components: {
            cpu,
            gpu,
            motherboard,
            ram,
            storage,
            psu,
            case: caseComponent,
            cooler
        }
    };

    await addDoc(collection(firestore, 'prebuiltSystems'), systemData);
}

export async function deletePrebuiltSystem(firestore: Firestore, systemId: string) {
    await deleteDoc(doc(firestore, 'prebuiltSystems', systemId));
}

// Seeding
export async function seedDatabase(firestore: Firestore) {
    const batch = writeBatch(firestore);

    // Seed parts
    const partsCollection = collection(firestore, 'pcParts');
    parts.forEach(partData => {
        const docRef = doc(partsCollection);
        batch.set(docRef, partData);
    });

    // Seed prebuilt systems
    const prebuiltsCollection = collection(firestore, 'prebuiltSystems');
    prebuiltSystems.forEach(systemData => {
        const docRef = doc(prebuiltsCollection);
        batch.set(docRef, systemData);
    });

    await batch.commit();
}
