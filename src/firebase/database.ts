
import { addDoc, collection, deleteDoc, doc, Firestore, writeBatch } from "firebase/firestore";
import type { AddPartFormSchema } from "@/components/add-part-dialog";
import type { AddPrebuiltFormSchema } from "@/components/add-prebuilt-dialog";
import { parts, prebuiltSystems } from "@/lib/database";

// Parts
export async function addPart(firestore: Firestore, part: AddPartFormSchema) {
    await addDoc(collection(firestore, 'parts'), part);
}

export async function deletePart(firestore: Firestore, partId: string) {
    await deleteDoc(doc(firestore, 'parts', partId));
}

// Prebuilt Systems
export async function addPrebuiltSystem(firestore: Firestore, system: AddPrebuiltFormSchema) {
    await addDoc(collection(firestore, 'prebuiltSystems'), system);
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
