# RAM Performance & Compatibility Guide

The performance of your RAM depends on its **Frequency (MHz)** and **CAS Latency (CL)**. Together, they determine the "First Word Latency."

## DDR4 vs DDR5
*   **DDR4:** Mature, affordable, and used by older AMD (AM4) and current Intel (LGA1700) platforms. 
*   **DDR5:** Current standard for AMD AM5 and Intel LGA1700/LGA1851. Offers higher bandwidth but at higher latency.

## The "Sweet Spots" (Price vs. Performance)

### DDR4 Sweet Spot
*   **3200MHz CL16:** The universal standard. High compatibility and low price.
*   **3600MHz CL18:** Slightly better for AMD Ryzen 5000 series due to the "Infinity Fabric" 1:1 ratio.
*   **3600MHz CL14/CL16:** High-end DDR4 performance.

### DDR5 Sweet Spot
*   **6000MHz CL30:** The absolute sweet spot for AMD Ryzen 7000/9000. Low latency and high stability.
*   **6400MHz CL32:** Good for high-end Intel builds.
*   **7200MHz+:** Only recommended for enthusiast Z790/Z890 boards with high-end memory controllers.

## Critical Rules
1.  **Dual Channel:** Always install RAM in pairs (2x8GB, 2x16GB) in the correct slots (usually 2 and 4) to enable dual-channel bandwidth. Single-channel RAM significantly slows down your CPU.
2.  **XMP/EXPO:** RAM will run at a slow default speed (2133 or 4800) until you enable XMP (Intel) or EXPO (AMD) in your BIOS.
3.  **Stability:** Mixing different RAM brands or speeds is NOT recommended and often leads to system crashes.

---
> [!NOTE]  
> 16GB is the minimum for gaming today. 32GB is highly recommended for newer titles and heavy multitasking.
