
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

// Parts
export async function addPart(firestore: Firestore, part: AddPartFormSchema) {
    const specificationsMap = part.specifications.reduce((acc, spec) => {
        acc[spec.key] = spec.value;
        return acc;
    }, {} as Record<string, string>);

    // Auto-extract wattage from the category-specific spec field when not explicitly set
    const specWattageRaw = WATTAGE_SPEC_KEY[part.category]
        ? parseFloat(specificationsMap[WATTAGE_SPEC_KEY[part.category]] || '0') || undefined
        : undefined;
    const resolvedWattage = part.wattage ?? specWattageRaw;

    const partData = {
        name: part.partName,
        brand: part.brand,
        price: part.price,
        stock: part.stockCount,
        imageUrl: part.imageUrl || `https://picsum.photos/seed/${part.partName.replace(/\s+/g, '').toLowerCase()}/800/600?pc,component`,
        specifications: specificationsMap,
        createdAt: new Date(),
        ...(resolvedWattage !== undefined && { wattage: resolvedWattage }),
        ...(part.performanceScore !== undefined && { performanceScore: part.performanceScore }),
        ...(part.dimensions !== undefined && { dimensions: part.dimensions })
    };
    await addDoc(collection(firestore, part.category), partData);
}


export async function updatePart(firestore: Firestore, category: Part['category'], partId: string, data: Partial<Omit<Part, 'id' | 'category'>>) {
    await updateDoc(doc(firestore, category, partId), data);
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

    await addDoc(collection(firestore, 'prebuiltSystems'), systemData);
}

export async function deletePrebuiltSystem(firestore: Firestore, systemId: string) {
    await deleteDoc(doc(firestore, 'prebuiltSystems', systemId));
}

// Users
export async function createUserProfile(firestore: Firestore, userId: string, data: Omit<UserProfile, 'id'>) {
    await setDoc(doc(firestore, 'users', userId), data);
}
