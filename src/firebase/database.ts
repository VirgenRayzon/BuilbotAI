
import { addDoc, collection, deleteDoc, doc, Firestore, writeBatch } from "firebase/firestore";
import type { AddPartFormSchema } from "@/components/add-part-dialog";
import type { AddPrebuiltFormSchema } from "@/components/add-prebuilt-dialog";
import { parts, prebuiltSystems } from "@/lib/database";
import type { Part, PrebuiltSystem } from "@/lib/types";

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
    await addDoc(collection(firestore, 'parts'), partData);
}

export async function deletePart(firestore: Firestore, partId: string) {
    await deleteDoc(doc(firestore, 'parts', partId));
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
    const partsCollection = collection(firestore, 'parts');
    parts.forEach(part => {
        const { id, ...partData } = part;
        const docRef = doc(partsCollection);
        batch.set(docRef, partData);
    });

    // Seed prebuilt systems
    const prebuiltsCollection = collection(firestore, 'prebuiltSystems');
    prebuiltSystems.forEach(system => {
        const { id, ...systemData } = system;
        const docRef = doc(prebuiltsCollection);
        batch.set(docRef, systemData);
    });

    await batch.commit();
}
