import { config } from 'dotenv';
config({ path: '.env' });

async function run() {
    const { persistImage } = await import('./src/app/image-actions');
    
    console.log("Bucket:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    console.log("Starting test...");
    const url = "https://picsum.photos/seed/ryzen/800/600";
    console.log("Attempting to persist URL:", url);
    const result = await persistImage(url, 'parts/cpu');
    console.log("Result:", result);
}

run();
