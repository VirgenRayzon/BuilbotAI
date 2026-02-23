
import { addDoc, collection, deleteDoc, doc, Firestore, setDoc, updateDoc } from "firebase/firestore";
import type { AddPartFormSchema } from "@/components/add-part-dialog";
import type { AddPrebuiltFormSchema } from "@/components/add-prebuilt-dialog";
import type { Part, PrebuiltSystem, UserProfile } from "@/lib/types";

// Parts
export async function addPart(firestore: Firestore, part: AddPartFormSchema) {
    const specificationsMap = part.specifications.reduce((acc, spec) => {
        acc[spec.key] = spec.value;
        return acc;
    }, {} as Record<string, string>);

    const partData = {
        name: part.partName,
        brand: part.brand,
        price: part.price,
        stock: part.stockCount,
        imageUrl: part.imageUrl || `https://picsum.photos/seed/${part.partName.replace(/\s+/g, '').toLowerCase()}/800/600?pc,component`,
        specifications: specificationsMap,
        ...(part.wattage !== undefined && { wattage: part.wattage })
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
        imageUrl: imageUrl || `https://picsum.photos/seed/${name.replace(/\s+/g, '').toLowerCase()}/800/600?gaming,pc`,
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

// Users
export async function createUserProfile(firestore: Firestore, userId: string, data: Omit<UserProfile, 'id'>) {
    await setDoc(doc(firestore, 'users', userId), data);
}
