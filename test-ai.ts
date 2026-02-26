import 'dotenv/config';
import { extractPartDetails } from './src/ai/flows/extract-part-details';

async function main() {
    try {
        const res = await extractPartDetails({ partName: 'RTX 4070 Ti Super' });
        console.log('Result:', res);
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
