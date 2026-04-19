
import { addDoc, collection, deleteDoc, doc, Firestore, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import type { AddPartFormSchema } from "@/components/add-part-dialog";
import type { AddPrebuiltFormSchema } from "@/components/add-prebuilt-dialog";
import type { Part, PrebuiltSystem, UserProfile, SystemNotification } from "@/lib/types";
import { fetchImageBase64, uploadBase64ToStorage } from "@/app/image-actions";

// Uploads an image to Firebase Storage.
// Local file uploads (data:image) go directly from the client (which has auth context).
// Remote URLs are fetched via a server action proxy first, then uploaded client-side.
async function uploadToStorageClient(url: string, storagePath: string, fileNamePrefix?: string): Promise<string> {
    if (!url) return url;

    const sanitizedPrefix = fileNamePrefix ? fileNamePrefix.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'image';
    // Use the part name as a subfolder: parts/cpu/amd_ryzen_5_9600x/image-123456.webp
    const fullPath = `${storagePath}/${sanitizedPrefix}`;

    // 1. Direct File Upload (Base64 Data URL) — upload from client (user is authenticated here)
    if (url.startsWith("data:image")) {
        console.log(`[Storage] Processing local file upload for path: ${fullPath}`);
        try {
            const splitIdx = url.indexOf(',');
            if (splitIdx === -1) return url;

            const header = url.substring(0, splitIdx);
            const base64Data = url.substring(splitIdx + 1);
            const contentType = header.replace('data:', '').replace(';base64', '');
            const extension = contentType.split("/")[1] || "jpg";

            const storage = getStorage();
            const fileName = `${sanitizedPrefix}-${Date.now()}.${extension}`;
            const storageRef = ref(storage, `${fullPath}/${fileName}`);

            console.log(`[Storage] Uploading to: ${storagePath}/${fileName} (${contentType})`);
            await uploadString(storageRef, base64Data, 'base64', { contentType });
            const downloadUrl = await getDownloadURL(storageRef);
            console.log(`[Storage] Upload successful: ${downloadUrl}`);
            return downloadUrl;
        } catch (error) {
            console.error(`[Storage] Client upload failed:`, error);
            return url;
        }
    }

    // 2. Ignore existing storage URLs or non-http URLs
    if (!url.startsWith("http") || url.includes("firebasestorage.googleapis.com")) {
        return url;
    }

    // 3. Remote URL — fetch via server action, then upload client-side
    console.log(`[Storage] Processing remote image: ${url} for path: ${storagePath}`);
    try {
        const proxyData = await fetchImageBase64(url);
        if (!proxyData) {
            console.warn(`[Storage] Failed to fetch image via proxy for ${url}`);
            return url;
        }

        const { base64, contentType, extension } = proxyData;
        const storage = getStorage();
        const fileName = `${sanitizedPrefix}-${Date.now()}.${extension}`;
        const storageRef = ref(storage, `${fullPath}/${fileName}`);

        console.log(`[Storage] Uploading fetched image to: ${storagePath}/${fileName}`);
        await uploadString(storageRef, base64, 'base64', { contentType });
        const downloadUrl = await getDownloadURL(storageRef);
        console.log(`[Storage] Upload successful: ${downloadUrl}`);
        return downloadUrl;
    } catch (error) {
        console.error(`[Storage] Upload failed for ${url}:`, error);
        return url;
    }
}

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

    const imageUrl = part.imageUrl || "";
    const persistedImageUrl = imageUrl ? await uploadToStorageClient(imageUrl, `parts/${part.category.toLowerCase()}`, part.partName) : "";

    const partData = {
        name: part.partName,
        brand: part.brand,
        price: part.price,
        stock: part.stockCount,
        imageUrl: persistedImageUrl,
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

    if (data.imageUrl) {
        data.imageUrl = await uploadToStorageClient(data.imageUrl, `parts/${category.toLowerCase()}`, data.name);
    }

    await updateDoc(doc(firestore, category, partId), cleanData(data));
}

export async function deletePart(firestore: Firestore, partId: string, category: Part['category']) {
    await deleteDoc(doc(firestore, category, partId));
}

export async function archivePart(firestore: Firestore, partId: string, category: Part['category'], isArchived: boolean = true) {
    await updateDoc(doc(firestore, category, partId), { isArchived });
}

export async function bulkArchiveParts(firestore: Firestore, items: { id: string, category: Part['category'] }[], isArchived: boolean = true) {
    const batch = writeBatch(firestore);
    items.forEach(item => {
        const partRef = doc(firestore, item.category, item.id);
        batch.update(partRef, { isArchived });
    });
    await batch.commit();
}

export async function bulkDeleteParts(firestore: Firestore, items: { id: string, category: Part['category'] }[]) {
    const batch = writeBatch(firestore);
    items.forEach(item => {
        const partRef = doc(firestore, item.category, item.id);
        batch.delete(partRef);
    });
    await batch.commit();
}

// Prebuilt Systems
export async function addPrebuiltSystem(firestore: Firestore, system: AddPrebuiltFormSchema) {
    const { name, tier, description, price, imageUrl, cpu, gpu, motherboard, ram, storage, psu, case: caseComponent, cooler } = system;

    const finalImageUrl = imageUrl || "";
    const persistedImageUrl = finalImageUrl ? await uploadToStorageClient(finalImageUrl, 'prebuiltSystems', name) : "";

    const systemData: Omit<PrebuiltSystem, 'id'> = {
        name,
        tier: tier as PrebuiltSystem['tier'],
        description,
        price,
        imageUrl: persistedImageUrl,
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
    const finalImageUrl = imageUrl || "";
    const persistedImageUrl = finalImageUrl ? await uploadToStorageClient(finalImageUrl, 'prebuiltSystems', name) : "";

    const systemData: Partial<PrebuiltSystem> = {
        name,
        tier: tier as PrebuiltSystem['tier'],
        description,
        price,
        imageUrl: persistedImageUrl,
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

export async function archivePrebuiltSystem(firestore: Firestore, systemId: string, isArchived: boolean = true) {
    await updateDoc(doc(firestore, 'prebuiltSystems', systemId), { isArchived });
}

export async function bulkArchivePrebuilts(firestore: Firestore, systemIds: string[], isArchived: boolean = true) {
    const batch = writeBatch(firestore);
    systemIds.forEach(id => {
        const systemRef = doc(firestore, 'prebuiltSystems', id);
        batch.update(systemRef, { isArchived });
    });
    await batch.commit();
}

export async function bulkDeletePrebuilts(firestore: Firestore, systemIds: string[]) {
    const batch = writeBatch(firestore);
    systemIds.forEach(id => {
        const systemRef = doc(firestore, 'prebuiltSystems', id);
        batch.delete(systemRef);
    });
    await batch.commit();
}

// Users
export async function createUserProfile(firestore: Firestore, userId: string, data: Omit<UserProfile, 'id'>) {
    await setDoc(doc(firestore, 'users', userId), data);
}
// System Notifications
export async function createSystemNotification(firestore: Firestore, notification: Omit<SystemNotification, 'id' | 'createdAt' | 'readBy'>) {
    const notificationRef = doc(collection(firestore, 'system_notifications'));
    await setDoc(notificationRef, {
        ...notification,
        id: notificationRef.id,
        readBy: [],
        createdAt: new Date()
    });
}

// Sales Metrics Reset
export async function resetSalesMetrics(
    firestore: Firestore, 
    orders: { id: string }[], 
    parts: { id: string, category: Part['category'] }[]
) {
    const batch = writeBatch(firestore);
    
    // 1. Delete all orders
    orders.forEach(order => {
        const orderRef = doc(firestore, 'orders', order.id);
        batch.delete(orderRef);
    });
    
    // 2. Reset popularity for all parts
    parts.forEach(part => {
        const partRef = doc(firestore, part.category, part.id);
        batch.update(partRef, { popularity: 0 });
    });
    
    await batch.commit();
}
