"use server";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { getAdminAuth } from "@/firebase/server-init";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
};

function isPrivateIpv4(address: string): boolean {
    const [a, b] = address.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
        (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) ||
        (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
}

function isPrivateIpv6(address: string): boolean {
    const normalized = address.toLowerCase();
    if (normalized === "::" || normalized === "::1") return true;
    if (normalized.startsWith("::ffff:")) {
        const mapped = normalized.slice(7);
        return isIP(mapped) !== 4 || isPrivateIpv4(mapped);
    }
    const first = Number.parseInt(normalized.split(":")[0], 16);
    return (first >= 0xfc00 && first <= 0xfdff) ||
        (first >= 0xfe80 && first <= 0xfebf) ||
        first >= 0xff00 || normalized.startsWith("2001:db8:");
}

async function validateRemoteUrl(value: string): Promise<URL> {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new Error("Enter a valid image URL.");
    }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
        throw new Error("Use a public HTTP or HTTPS image URL.");
    }
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
        throw new Error("Use a public image URL.");
    }
    // Reject any host that resolves to a non-public address, including redirects.
    const addresses = await lookup(hostname, { all: true });
    if (addresses.length === 0 || addresses.some(({ address, family }) =>
        family === 4 ? isPrivateIpv4(address) : family === 6 ? isPrivateIpv6(address) : true
    )) {
        throw new Error("Use a public image URL.");
    }
    return url;
}

function hasImageSignature(bytes: Buffer, contentType: string): boolean {
    if (contentType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (contentType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (contentType === "image/webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (contentType === "image/gif") return ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6));
    if (contentType === "image/avif") return ["avif", "avis"].includes(bytes.toString("ascii", 8, 12));
    return false;
}

/** Fetches a public image for the signed-in manager; Storage upload happens client-side. */
async function downloadImage(url: string, idToken: string): Promise<{ base64: string; contentType: string; extension: string }> {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    if (decoded.isManager !== true && decoded.isSuperAdmin !== true) {
        throw new Error("Only managers can import images.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
        let current = url;
        for (let redirect = 0; redirect <= 3; redirect++) {
            const parsed = await validateRemoteUrl(current);
            const response = await fetch(parsed, {
                signal: controller.signal,
                redirect: "manual",
                cache: "no-store",
                headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif" },
            });

            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get("location");
                if (!location) throw new Error("The image link redirected without a destination.");
                current = new URL(location, parsed).toString();
                continue;
            }
            if (!response.ok) throw new Error(`Could not download the image (HTTP ${response.status}).`);

            const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "";
            const extension = IMAGE_TYPES[contentType];
            if (!extension) throw new Error("The link must point to a JPG, PNG, WebP, GIF, or AVIF image.");
            const contentLength = Number(response.headers.get("content-length") || 0);
            if (contentLength > MAX_IMAGE_BYTES) throw new Error("Images must be 5 MB or smaller.");

            const reader = response.body?.getReader();
            if (!reader) throw new Error("The image could not be read.");
            const chunks: Uint8Array[] = [];
            let size = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                size += value.byteLength;
                if (size > MAX_IMAGE_BYTES) {
                    await reader.cancel();
                    throw new Error("Images must be 5 MB or smaller.");
                }
                chunks.push(value);
            }
            if (size === 0) throw new Error("The image is empty.");
            const image = Buffer.concat(chunks);
            if (!hasImageSignature(image, contentType)) throw new Error("The link did not return a valid image.");
            return { base64: image.toString("base64"), contentType, extension };
        }
        throw new Error("The image link redirected too many times.");
    } catch (error) {
        if (controller.signal.aborted) throw new Error("The image download timed out. Try another link.");
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function fetchImageBase64(
    url: string,
    idToken: string
): Promise<{ base64: string; contentType: string; extension: string } | { error: string }> {
    try {
        return await downloadImage(url, idToken);
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Could not import the image." };
    }
}
