"use server";

import { getAdminStorage } from "@/firebase/server-init";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import crypto from "crypto";

/**
 * Fetches an image from an external URL and returns it as a Base64 string.
 * This acts as a CORS proxy so the client can upload the image to Firebase Storage natively.
 */
export async function fetchImageBase64(url: string): Promise<{ base64: string; contentType: string; extension: string } | null> {
    if (!url || !url.startsWith("http")) {
        return null; 
    }

    console.log(`[Server Action] fetchImageBase64 called for: ${url}`);

    try {
        // Add a 10-second timeout to the fetch call to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`[Server Action] Failed to fetch image from ${url}: ${response.statusText}`);
            return null;
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/jpeg";
        const extension = contentType.split("/")[1] || "jpg";
        
        const base64 = Buffer.from(buffer).toString("base64");
        
        console.log(`[Server Action] Successfully processed image: ${url} (${buffer.byteLength} bytes)`);
        return { base64, contentType, extension };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error(`[Server Action] Timeout fetching image from ${url}`);
        } else {
            console.error(`[Server Action] Error fetching image from ${url}:`, error);
        }
        return null;
    }
}

/**
 * Uploads a Base64 image string to Firebase Storage from the server.
 * This bypasses browser CORS restrictions entirely.
 */
export async function uploadBase64ToStorage(base64Data: string, storagePath: string, fileNamePrefix?: string): Promise<string | null> {
    try {
        console.log(`[Server Action] uploadBase64ToStorage called for path: ${storagePath}`);
        
        const storage = getAdminStorage();
        const sanitizedPrefix = fileNamePrefix ? fileNamePrefix.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'image';
        
        // Handle metadata from base64 if present, or default to jpeg
        let contentType = "image/jpeg";
        let extension = "jpg";
        let cleanBase64 = base64Data;

        if (base64Data.startsWith("data:")) {
            const splitIdx = base64Data.indexOf(',');
            if (splitIdx !== -1) {
                const header = base64Data.substring(0, splitIdx);
                cleanBase64 = base64Data.substring(splitIdx + 1);
                contentType = header.replace('data:', '').replace(';base64', '');
                extension = contentType.split("/")[1] || "jpg";
            }
        }

        const fileName = `${sanitizedPrefix}.${extension}`;
        const storageRef = ref(storage, `${storagePath}/${fileName}`);

        console.log(`[Server Action] Uploading to: ${storagePath}/${fileName} (${contentType})`);
        
        await uploadString(storageRef, cleanBase64, 'base64', { contentType });
        const downloadUrl = await getDownloadURL(storageRef);
        
        console.log(`[Server Action] Upload successful: ${downloadUrl}`);
        return downloadUrl;
    } catch (error) {
        console.error(`[Server Action] Upload failed:`, error);
        return null;
    }
}
