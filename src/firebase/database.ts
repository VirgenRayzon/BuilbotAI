
import { addDoc, collection, deleteDoc, doc, Firestore, setDoc, updateDoc } from "firebase/firestore";
import type { AddPartFormSchema } from "@/components/add-part-dialog";
import type { AddPrebuiltFormSchema } from "@/components/add-prebuilt-dialog";
import type { Part, PrebuiltSystem, UserProfile } from "@/lib/types";

// Maps each category to the spec key that carries its wattage value
const WATTAGE_SPEC_KEY: Record<string, string> = {
    CPU: 'TDP / Peak Power',
    GPU: 'TGP / Power Draw (W)',
    PSU: 'Wattage (W)',
    Cooler: 'TDP Rating',
};

// Helper to extract wattage from specifications
function resolveWattage(category: string, wattage?: number, specifications?: Record<string, string | number>) {
    if (wattage !== undefined) return wattage;
    if (!specifications || !category) return undefined;

    const key = WATTAGE_SPEC_KEY[category];
    if (!key) return undefined;

    const val = specifications[key];
    if (!val) return undefined;

    return parseFloat(String(val) || '0') || undefined;
}

// Helper to clean undefined values recursively
function cleanData(obj: any): any {
    if (Array.isArray(obj)) return obj.map(v => v);
    if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        Object.entries(obj).forEach(([key, value]) => {
            if (value !== undefined) {
                cleaned[key] = (typeof value === 'object' && value !== null && !(value instanceof Date))
                    ? cleanData(value)
                    : value;
            }
        });
        return cleaned;
    }
    return obj;
}

// Parts
export async function addPart(firestore: Firestore, part: AddPartFormSchema) {
    const specificationsMap = part.specifications.reduce((acc, spec) => {
        acc[spec.key] = spec.value;
        return acc;
    }, {} as Record<string, string>);

    const resolvedWattage = resolveWattage(part.category, part.wattage, specificationsMap);

    const partData = {
        name: part.partName,
        brand: part.brand,
        price: part.price,
        stock: part.stockCount,
        imageUrl: part.imageUrl || `https://picsum.photos/seed/${part.partName.replace(/\s+/g, '').toLowerCase()}/800/600?pc,component`,
        specifications: specificationsMap,
        description: part.description,
        createdAt: new Date(),
        wattage: resolvedWattage,
        performanceScore: part.performanceScore,
        dimensions: part.dimensions,
        packageType: part.packageType
    };

    await addDoc(collection(firestore, part.category), cleanData(partData));
}


export async function updatePart(firestore: Firestore, category: Part['category'], partId: string, data: Partial<Omit<Part, 'id' | 'category'>>) {
    // If specifications are being updated but not wattage, try to re-resolve wattage
    if (data.specifications && data.wattage === undefined) {
        data.wattage = resolveWattage(category, undefined, data.specifications);
    }

    await updateDoc(doc(firestore, category, partId), cleanData(data));
}

export async function deletePart(firestore: Firestore, partId: string, category: Part['category']) {
    await deleteDoc(doc(firestore, category, partId));
}

// Prebuilt Systems
export async function addPrebuiltSystem(firestore: Firestore, system: AddPrebuiltFormSchema) {
    const { name, tier, description, price, imageUrl, cpu, gpu, motherboard, ram, storage, psu, case: caseComponent, cooler } = system;

    const systemData: Omit<PrebuiltSystem, 'id'> = {
        name,
        tier: tier as PrebuiltSystem['tier'],
        description,
        price,
        imageUrl: imageUrl || `https://placehold.co/800x600/1a1a2e/e0e0e0?text=${encodeURIComponent(name)}`,
        components: {
            cpu,
            gpu,
            motherboard,
            ram,
            storage,
            psu,
            case: caseComponent,
            cooler
        },
        createdAt: new Date()
    };

    await addDoc(collection(firestore, 'prebuiltSystems'), cleanData(systemData));
}

export async function deletePrebuiltSystem(firestore: Firestore, systemId: string) {
    await deleteDoc(doc(firestore, 'prebuiltSystems', systemId));
}

export async function updatePrebuiltSystem(firestore: Firestore, systemId: string, data: AddPrebuiltFormSchema) {
    const { name, tier, description, price, imageUrl, cpu, gpu, motherboard, ram, storage, psu, case: caseComponent, cooler } = data;
    const systemData: Partial<PrebuiltSystem> = {
        name,
        tier: tier as PrebuiltSystem['tier'],
        description,
        price,
        imageUrl: imageUrl || `https://placehold.co/800x600/1a1a2e/e0e0e0?text=${encodeURIComponent(name)}`,
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
    await updateDoc(doc(firestore, 'prebuiltSystems', systemId), cleanData(systemData));
}

// Users
export async function createUserProfile(firestore: Firestore, userId: string, data: Omit<UserProfile, 'id'>) {
    await setDoc(doc(firestore, 'users', userId), data);
}
