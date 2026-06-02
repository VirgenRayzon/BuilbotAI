import 'dotenv/config';
import { getInventoryFromFirestore } from '../src/lib/inventory-fetcher';

async function testFetch() {
  console.log("Starting database fetch...");
  console.time("Total Fetch Time");
  
  const categoriesToFetch = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'];
  
  try {
    const results = await Promise.all(
      categoriesToFetch.map(async (cat) => {
        console.time(`Fetch ${cat}`);
        const res = await getInventoryFromFirestore(cat, undefined, 20);
        console.timeEnd(`Fetch ${cat}`);
        return res;
      })
    );
    
    const flat = results.flat();
    console.timeEnd("Total Fetch Time");
    console.log(`Successfully fetched ${flat.length} items total.`);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testFetch();
