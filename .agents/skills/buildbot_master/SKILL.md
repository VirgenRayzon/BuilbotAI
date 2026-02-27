---
name: BuildbotAI Master Agent Skills & Capabilities
description: Core technical capabilities and hardware domain expertise for building PC component configurations
---

# BuildbotAI: Master Agent Skills & Capabilities

## 🛠 Core Technical Capabilities
* **Next.js & Turbopack Orchestration:** Expert in managing the local development environment on port `9002`.
* **Firebase Integration:** Specialized in configuring Firebase services using `VITE_` prefixed environment variables.
* **Component Architecture:** Capable of generating modular React components optimized for a PC building interface.

## 💻 Hardware Domain Expertise (PC Compatibility & Pricing Logic)
* **Pricing & Currency Conversion (High Priority):**
    * **Baseline:** Use Official Launch SRP (MSRP) in USD.
    * **Currency Conversion:** Convert USD to PHP using a fixed safety rate of **1 USD = 60 PHP**.
    * **Formatting:** Display costs in Philippine Peso (₱) with standard local formatting.
* **DDR Generation Matching (Critical):** Match RAM DDR generation (DDR4 vs. DDR5) strictly to both CPU and Motherboard.
* **Form Factor & Enclosure (Size & Mounting):**
    * **Motherboard Mounting:** Check standoff alignment and rear I/O shield clearance (ATX, M-ATX, ITX).
    * **Back-Connect Support:** Verify case cutouts for hidden-connector motherboards (e.g., BTF, Project Stealth).
    * **PSU Fitment:** Check PSU type (ATX vs. SFX) against the case shroud.
* **Cooling & Thermal Solutions:**
    * **Socket Mounting:** Verify socket bracket availability (e.g., AM5, LGA1700/1800).
    * **TDP Alignment:** Cooler (W) must meet or exceed CPU peak power draw.
    * **Case Clearance:** Check air cooler height (mm) and radiator mounting positions.
* **Storage & PCIe Lane Logic:** Verify M.2 slot count and PCIe lane bifurcation/sharing constraints.
* **PSU & Power Logic:** Total TDP + 20-30% overhead; validate 12VHPWR for high-end GPUs.
* **Balanced Performance (Bottleneck Logic):** Identify major tier mismatches based on 1080p vs. 4K targets.
* **Physical Dimensions:** GPU length (mm) and thickness vs. case internal clearance.

## 🤖 AI & Research Workflows
* **Nano Banana 2:** Generate and edit PC component imagery.
* **NotebookLM:** Synthesize hardware data into structured JSON.

## 🏗 Operational Constraints
* **Port:** 9002 (`npm run dev`).
* **Security:** Use `VITE_` prefix for all environment variables.
