/**
 * One-off bulk pharmacy stock seed — populates starter inventory across the
 * 11 requested drug categories, sized for roughly 2 months of stock at a
 * small-to-medium general hospital.
 *
 * Run from the project root:
 *   node scripts/add-pharmacy-stock.mjs
 *
 * Safe to re-run: skips any drug name already present in pharmacy_stock.
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local");
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
        if (m) process.env[m[1]] = m[2].trim();
    }
}

const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL;
if (!NEON_DATABASE_URL) {
    console.error("NEON_DATABASE_URL is not set in .env.local");
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Category values match helpers/constants.tsx DRUG_CATEGORIES / app/pharmacy/inventory/page.tsx CATEGORIES.
// Quantities/prices are starter approximations for ~2 months, not clinical or procurement advice —
// review against your actual patient volume and supplier pricing before relying on them.
const SUPPLIER = "National Medical Stores (NMS)";
const EXPIRY = "2028-06-30";

const DRUGS = [
    // 1. Antibiotics — oral
    { drugName: "Amoxicillin 500mg", genericName: "Amoxicillin", category: "Antibiotics", quantity: 6000, unit: "capsules", reorderLevel: 1200, unitPrice: 200 },
    { drugName: "Amoxicillin-Clavulanate 625mg", genericName: "Co-amoxiclav", category: "Antibiotics", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 800 },
    { drugName: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin", category: "Antibiotics", quantity: 3000, unit: "tablets", reorderLevel: 600, unitPrice: 300 },
    { drugName: "Metronidazole 400mg", genericName: "Metronidazole", category: "Antibiotics", quantity: 4000, unit: "tablets", reorderLevel: 800, unitPrice: 100 },
    { drugName: "Doxycycline 100mg", genericName: "Doxycycline", category: "Antibiotics", quantity: 2000, unit: "capsules", reorderLevel: 400, unitPrice: 150 },
    { drugName: "Azithromycin 500mg", genericName: "Azithromycin", category: "Antibiotics", quantity: 1500, unit: "tablets", reorderLevel: 300, unitPrice: 700 },
    { drugName: "Cotrimoxazole 480mg", genericName: "Sulfamethoxazole/Trimethoprim", category: "Antibiotics", quantity: 3000, unit: "tablets", reorderLevel: 600, unitPrice: 80 },

    // 2. Antibiotics — IV
    { drugName: "Ceftriaxone 1g Injection", genericName: "Ceftriaxone", category: "Antibiotics", quantity: 600, unit: "vials", reorderLevel: 120, unitPrice: 4500 },
    { drugName: "Metronidazole 500mg/100ml IV Infusion", genericName: "Metronidazole", category: "Antibiotics", quantity: 400, unit: "bottles", reorderLevel: 80, unitPrice: 3500 },
    { drugName: "Ampicillin 500mg Injection", genericName: "Ampicillin", category: "Antibiotics", quantity: 500, unit: "vials", reorderLevel: 100, unitPrice: 2500 },
    { drugName: "Gentamicin 80mg Injection", genericName: "Gentamicin", category: "Antibiotics", quantity: 600, unit: "ampoules", reorderLevel: 120, unitPrice: 1200 },
    { drugName: "Benzylpenicillin 5MU Injection", genericName: "Crystalline Penicillin", category: "Antibiotics", quantity: 400, unit: "vials", reorderLevel: 80, unitPrice: 3000 },

    // 3. Antifungal
    { drugName: "Fluconazole 150mg", genericName: "Fluconazole", category: "Antifungals", quantity: 1000, unit: "capsules", reorderLevel: 200, unitPrice: 1500 },
    { drugName: "Nystatin Oral Suspension 100,000IU/ml", genericName: "Nystatin", category: "Antifungals", quantity: 300, unit: "bottles", reorderLevel: 60, unitPrice: 5000 },
    { drugName: "Clotrimazole 1% Cream", genericName: "Clotrimazole", category: "Antifungals", quantity: 400, unit: "bottles", reorderLevel: 80, unitPrice: 2500 },
    { drugName: "Ketoconazole 200mg", genericName: "Ketoconazole", category: "Antifungals", quantity: 800, unit: "tablets", reorderLevel: 160, unitPrice: 400 },

    // 4. Hypertension & cardiovascular
    { drugName: "Amlodipine 5mg", genericName: "Amlodipine", category: "Cardiovascular", quantity: 4000, unit: "tablets", reorderLevel: 800, unitPrice: 150 },
    { drugName: "Nifedipine Retard 20mg", genericName: "Nifedipine", category: "Cardiovascular", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 250 },
    { drugName: "Losartan 50mg", genericName: "Losartan", category: "Cardiovascular", quantity: 2500, unit: "tablets", reorderLevel: 500, unitPrice: 300 },
    { drugName: "Hydrochlorothiazide 25mg", genericName: "Hydrochlorothiazide", category: "Cardiovascular", quantity: 3000, unit: "tablets", reorderLevel: 600, unitPrice: 100 },
    { drugName: "Atenolol 50mg", genericName: "Atenolol", category: "Cardiovascular", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 150 },
    { drugName: "Aspirin 75mg", genericName: "Acetylsalicylic Acid", category: "Cardiovascular", quantity: 3000, unit: "tablets", reorderLevel: 600, unitPrice: 50 },
    { drugName: "Atorvastatin 20mg", genericName: "Atorvastatin", category: "Cardiovascular", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 350 },

    // 5. Diabetes & Endocrine
    { drugName: "Metformin 500mg", genericName: "Metformin", category: "Diabetes & Endocrine", quantity: 5000, unit: "tablets", reorderLevel: 1000, unitPrice: 100 },
    { drugName: "Glibenclamide 5mg", genericName: "Glibenclamide", category: "Diabetes & Endocrine", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 120 },
    { drugName: "Soluble Insulin 100IU/ml", genericName: "Insulin (Actrapid)", category: "Diabetes & Endocrine", quantity: 200, unit: "vials", reorderLevel: 40, unitPrice: 25000 },
    { drugName: "Levothyroxine 50mcg", genericName: "Levothyroxine", category: "Diabetes & Endocrine", quantity: 1500, unit: "tablets", reorderLevel: 300, unitPrice: 200 },

    // 6. Hormonal supplements
    { drugName: "Prednisolone 5mg", genericName: "Prednisolone", category: "Other", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 100 },
    { drugName: "Dexamethasone 4mg Injection", genericName: "Dexamethasone", category: "Other", quantity: 300, unit: "ampoules", reorderLevel: 60, unitPrice: 1000 },
    { drugName: "Hydrocortisone 100mg Injection", genericName: "Hydrocortisone", category: "Other", quantity: 200, unit: "vials", reorderLevel: 40, unitPrice: 3500 },

    // 7. Analgesia and antipyretics
    { drugName: "Paracetamol 500mg", genericName: "Paracetamol", category: "Analgesics", quantity: 8000, unit: "tablets", reorderLevel: 1600, unitPrice: 50 },
    { drugName: "Paracetamol Injection 1g/100ml", genericName: "Paracetamol", category: "Analgesics", quantity: 300, unit: "bottles", reorderLevel: 60, unitPrice: 4500 },
    { drugName: "Diclofenac 50mg", genericName: "Diclofenac", category: "Analgesics", quantity: 3000, unit: "tablets", reorderLevel: 600, unitPrice: 100 },
    { drugName: "Ibuprofen 400mg", genericName: "Ibuprofen", category: "Analgesics", quantity: 4000, unit: "tablets", reorderLevel: 800, unitPrice: 80 },
    { drugName: "Tramadol 50mg", genericName: "Tramadol", category: "Analgesics", quantity: 1500, unit: "capsules", reorderLevel: 300, unitPrice: 300 },

    // 8. Topical creams
    { drugName: "Betamethasone 0.1% Cream", genericName: "Betamethasone", category: "Other", quantity: 300, unit: "bottles", reorderLevel: 60, unitPrice: 3000 },
    { drugName: "Silver Sulfadiazine 1% Cream", genericName: "Silver Sulfadiazine", category: "Other", quantity: 200, unit: "bottles", reorderLevel: 40, unitPrice: 6000 },
    { drugName: "Whitfield's Ointment", genericName: "Benzoic + Salicylic Acid", category: "Other", quantity: 200, unit: "bottles", reorderLevel: 40, unitPrice: 2000 },
    { drugName: "Zinc Oxide Cream", genericName: "Zinc Oxide", category: "Other", quantity: 250, unit: "bottles", reorderLevel: 50, unitPrice: 1500 },

    // 9. Antimalarial
    { drugName: "Artemether-Lumefantrine 20/120mg", genericName: "Coartem", category: "Antiparasitics", quantity: 6000, unit: "tablets", reorderLevel: 1200, unitPrice: 150 },
    { drugName: "Artesunate Injection 60mg", genericName: "Artesunate", category: "Antiparasitics", quantity: 500, unit: "vials", reorderLevel: 100, unitPrice: 3500 },
    { drugName: "Quinine Sulfate 300mg", genericName: "Quinine", category: "Antiparasitics", quantity: 1500, unit: "tablets", reorderLevel: 300, unitPrice: 100 },
    { drugName: "Sulfadoxine-Pyrimethamine", genericName: "Fansidar", category: "Antiparasitics", quantity: 1000, unit: "tablets", reorderLevel: 200, unitPrice: 200 },

    // 10. Contraceptive pills
    { drugName: "Combined Oral Contraceptive (Microgynon)", genericName: "Ethinylestradiol/Levonorgestrel", category: "Other", quantity: 300, unit: "units", reorderLevel: 60, unitPrice: 3000 },
    { drugName: "Progestin-only Pill", genericName: "Levonorgestrel", category: "Other", quantity: 200, unit: "units", reorderLevel: 40, unitPrice: 3500 },
    { drugName: "Emergency Contraceptive Pill (Postinor-2)", genericName: "Levonorgestrel 1.5mg", category: "Other", quantity: 150, unit: "units", reorderLevel: 30, unitPrice: 5000 },

    // 11. Gastrointestinal
    { drugName: "Omeprazole 20mg", genericName: "Omeprazole", category: "Gastrointestinal", quantity: 3000, unit: "capsules", reorderLevel: 600, unitPrice: 200 },
    { drugName: "Oral Rehydration Salts", genericName: "ORS", category: "Gastrointestinal", quantity: 3000, unit: "sachets", reorderLevel: 600, unitPrice: 500 },
    { drugName: "Zinc Sulfate 20mg", genericName: "Zinc Sulfate", category: "Gastrointestinal", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 100 },
    { drugName: "Metoclopramide 10mg", genericName: "Metoclopramide", category: "Gastrointestinal", quantity: 1500, unit: "tablets", reorderLevel: 300, unitPrice: 100 },
    { drugName: "Magnesium Trisilicate", genericName: "Antacid", category: "Gastrointestinal", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 50 },
    { drugName: "Loperamide 2mg", genericName: "Loperamide", category: "Gastrointestinal", quantity: 1000, unit: "capsules", reorderLevel: 200, unitPrice: 150 },
];

async function main() {
    const existing = await pool.query(`SELECT data->>'drugName' AS name FROM pharmacy_stock`);
    const existingNames = new Set(existing.rows.map(r => r.name));

    let created = 0, skipped = 0;
    for (const drug of DRUGS) {
        if (existingNames.has(drug.drugName)) {
            console.log(`Skip (already exists): ${drug.drugName}`);
            skipped++;
            continue;
        }
        const data = {
            ...drug,
            supplier: SUPPLIER,
            batchNo: `STK-2026-${String(created + 1).padStart(3, "0")}`,
            expiryDate: EXPIRY,
            createdAt: new Date().toISOString(),
            createdBy: "System Seed",
            lastRestocked: new Date().toISOString(),
            lastRestockedBy: "System Seed",
        };
        await pool.query(
            `INSERT INTO pharmacy_stock (data, created_at) VALUES ($1::jsonb, NOW())`,
            [JSON.stringify(data)]
        );
        console.log(`Created: ${drug.drugName} (${drug.quantity} ${drug.unit})`);
        created++;
    }

    console.log(`\nDone. ${created} drugs created, ${skipped} skipped (already existed).`);
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
