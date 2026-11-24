/**
 * One-off bulk pharmacy stock seed — populates starter inventory across the
 * 13 requested drug categories, sized for roughly 2 months of stock at a
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

// Category values match helpers/constants.tsx DRUG_CATEGORIES / app/pharmacy/inventory/page.tsx.
// The category field is free text there (with these as datalist suggestions), so
// new categories can be added at any time from the Inventory page without a code change.
// Quantities/prices are starter approximations for ~2 months, not clinical or procurement advice —
// review against your actual patient volume and supplier pricing before relying on them.
const SUPPLIER = "National Medical Stores (NMS)";
const EXPIRY = "2028-06-30";

const DRUGS = [
    // 1. Antibiotics — oral
    { drugName: "Amoxicillin 500mg", genericName: "Amoxicillin", category: "Antibiotics (PO)", quantity: 6000, unit: "capsules", reorderLevel: 1200, unitPrice: 200 },
    { drugName: "Amoxicillin-Clavulanate 625mg", genericName: "Co-amoxiclav", category: "Antibiotics (PO)", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 800 },
    { drugName: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin", category: "Antibiotics (PO)", quantity: 3000, unit: "tablets", reorderLevel: 600, unitPrice: 300 },
    { drugName: "Metronidazole 400mg", genericName: "Metronidazole", category: "Antibiotics (PO)", quantity: 4000, unit: "tablets", reorderLevel: 800, unitPrice: 100 },
    { drugName: "Doxycycline 100mg", genericName: "Doxycycline", category: "Antibiotics (PO)", quantity: 2000, unit: "capsules", reorderLevel: 400, unitPrice: 150 },
    { drugName: "Azithromycin 500mg", genericName: "Azithromycin", category: "Antibiotics (PO)", quantity: 1500, unit: "tablets", reorderLevel: 300, unitPrice: 700 },
    { drugName: "Cotrimoxazole 480mg", genericName: "Sulfamethoxazole/Trimethoprim", category: "Antibiotics (PO)", quantity: 3000, unit: "tablets", reorderLevel: 600, unitPrice: 80 },

    // 2. Antibiotics — IV
    { drugName: "Ceftriaxone 1g Injection", genericName: "Ceftriaxone", category: "Antibiotics (IV)", quantity: 600, unit: "vials", reorderLevel: 120, unitPrice: 4500 },
    { drugName: "Metronidazole 500mg/100ml IV Infusion", genericName: "Metronidazole", category: "Antibiotics (IV)", quantity: 400, unit: "bottles", reorderLevel: 80, unitPrice: 3500 },
    { drugName: "Ampicillin 500mg Injection", genericName: "Ampicillin", category: "Antibiotics (IV)", quantity: 500, unit: "vials", reorderLevel: 100, unitPrice: 2500 },
    { drugName: "Gentamicin 80mg Injection", genericName: "Gentamicin", category: "Antibiotics (IV)", quantity: 600, unit: "ampoules", reorderLevel: 120, unitPrice: 1200 },
    { drugName: "Benzylpenicillin 5MU Injection", genericName: "Crystalline Penicillin", category: "Antibiotics (IV)", quantity: 400, unit: "vials", reorderLevel: 80, unitPrice: 3000 },

    // 3. Antifungal
    { drugName: "Fluconazole 150mg", genericName: "Fluconazole", category: "Antifungal", quantity: 1000, unit: "capsules", reorderLevel: 200, unitPrice: 1500 },
    { drugName: "Nystatin Oral Suspension 100,000IU/ml", genericName: "Nystatin", category: "Antifungal", quantity: 300, unit: "bottles", reorderLevel: 60, unitPrice: 5000 },
    { drugName: "Clotrimazole 1% Cream", genericName: "Clotrimazole", category: "Antifungal", quantity: 400, unit: "bottles", reorderLevel: 80, unitPrice: 2500 },
    { drugName: "Ketoconazole 200mg", genericName: "Ketoconazole", category: "Antifungal", quantity: 800, unit: "tablets", reorderLevel: 160, unitPrice: 400 },

    // 4. Hypertension & cardiovascular
    { drugName: "Amlodipine 5mg", genericName: "Amlodipine", category: "Hypertension & Cardiovascular", quantity: 4000, unit: "tablets", reorderLevel: 800, unitPrice: 150 },
    { drugName: "Nifedipine Retard 20mg", genericName: "Nifedipine", category: "Hypertension & Cardiovascular", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 250 },
    { drugName: "Losartan 50mg", genericName: "Losartan", category: "Hypertension & Cardiovascular", quantity: 2500, unit: "tablets", reorderLevel: 500, unitPrice: 300 },
    { drugName: "Hydrochlorothiazide 25mg", genericName: "Hydrochlorothiazide", category: "Hypertension & Cardiovascular", quantity: 3000, unit: "tablets", reorderLevel: 600, unitPrice: 100 },
    { drugName: "Atenolol 50mg", genericName: "Atenolol", category: "Hypertension & Cardiovascular", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 150 },
    { drugName: "Aspirin 75mg", genericName: "Acetylsalicylic Acid", category: "Hypertension & Cardiovascular", quantity: 3000, unit: "tablets", reorderLevel: 600, unitPrice: 50 },
    { drugName: "Atorvastatin 20mg", genericName: "Atorvastatin", category: "Hypertension & Cardiovascular", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 350 },

    // 5. Diabetes & Endocrine
    { drugName: "Metformin 500mg", genericName: "Metformin", category: "Diabetes & Endocrine", quantity: 5000, unit: "tablets", reorderLevel: 1000, unitPrice: 100 },
    { drugName: "Glibenclamide 5mg", genericName: "Glibenclamide", category: "Diabetes & Endocrine", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 120 },
    { drugName: "Soluble Insulin 100IU/ml", genericName: "Insulin (Actrapid)", category: "Diabetes & Endocrine", quantity: 200, unit: "vials", reorderLevel: 40, unitPrice: 25000 },
    { drugName: "Levothyroxine 50mcg", genericName: "Levothyroxine", category: "Diabetes & Endocrine", quantity: 1500, unit: "tablets", reorderLevel: 300, unitPrice: 200 },

    // 6. Hormonal supplements
    { drugName: "Prednisolone 5mg", genericName: "Prednisolone", category: "Hormonal Supplements", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 100 },
    { drugName: "Dexamethasone 4mg Injection", genericName: "Dexamethasone", category: "Hormonal Supplements", quantity: 300, unit: "ampoules", reorderLevel: 60, unitPrice: 1000 },
    { drugName: "Hydrocortisone 100mg Injection", genericName: "Hydrocortisone", category: "Hormonal Supplements", quantity: 200, unit: "vials", reorderLevel: 40, unitPrice: 3500 },

    // 7. Analgesia and antipyretics
    { drugName: "Paracetamol 500mg", genericName: "Paracetamol", category: "Analgesics & Antipyretics", quantity: 8000, unit: "tablets", reorderLevel: 1600, unitPrice: 50 },
    { drugName: "Paracetamol Injection 1g/100ml", genericName: "Paracetamol", category: "Analgesics & Antipyretics", quantity: 300, unit: "bottles", reorderLevel: 60, unitPrice: 4500 },
    { drugName: "Diclofenac 50mg", genericName: "Diclofenac", category: "Analgesics & Antipyretics", quantity: 3000, unit: "tablets", reorderLevel: 600, unitPrice: 100 },
    { drugName: "Ibuprofen 400mg", genericName: "Ibuprofen", category: "Analgesics & Antipyretics", quantity: 4000, unit: "tablets", reorderLevel: 800, unitPrice: 80 },
    { drugName: "Tramadol 50mg", genericName: "Tramadol", category: "Analgesics & Antipyretics", quantity: 1500, unit: "capsules", reorderLevel: 300, unitPrice: 300 },

    // 8. Topical creams
    { drugName: "Betamethasone 0.1% Cream", genericName: "Betamethasone", category: "Topical Creams", quantity: 300, unit: "bottles", reorderLevel: 60, unitPrice: 3000 },
    { drugName: "Silver Sulfadiazine 1% Cream", genericName: "Silver Sulfadiazine", category: "Topical Creams", quantity: 200, unit: "bottles", reorderLevel: 40, unitPrice: 6000 },
    { drugName: "Whitfield's Ointment", genericName: "Benzoic + Salicylic Acid", category: "Topical Creams", quantity: 200, unit: "bottles", reorderLevel: 40, unitPrice: 2000 },
    { drugName: "Zinc Oxide Cream", genericName: "Zinc Oxide", category: "Topical Creams", quantity: 250, unit: "bottles", reorderLevel: 50, unitPrice: 1500 },

    // 9. Antimalarial
    { drugName: "Artemether-Lumefantrine 20/120mg", genericName: "Coartem", category: "Antimalarial", quantity: 6000, unit: "tablets", reorderLevel: 1200, unitPrice: 150 },
    { drugName: "Artesunate Injection 60mg", genericName: "Artesunate", category: "Antimalarial", quantity: 500, unit: "vials", reorderLevel: 100, unitPrice: 3500 },
    { drugName: "Quinine Sulfate 300mg", genericName: "Quinine", category: "Antimalarial", quantity: 1500, unit: "tablets", reorderLevel: 300, unitPrice: 100 },
    { drugName: "Sulfadoxine-Pyrimethamine", genericName: "Fansidar", category: "Antimalarial", quantity: 1000, unit: "tablets", reorderLevel: 200, unitPrice: 200 },

    // 10. Contraceptive pills
    { drugName: "Combined Oral Contraceptive (Microgynon)", genericName: "Ethinylestradiol/Levonorgestrel", category: "Contraceptives", quantity: 300, unit: "units", reorderLevel: 60, unitPrice: 3000 },
    { drugName: "Progestin-only Pill", genericName: "Levonorgestrel", category: "Contraceptives", quantity: 200, unit: "units", reorderLevel: 40, unitPrice: 3500 },
    { drugName: "Emergency Contraceptive Pill (Postinor-2)", genericName: "Levonorgestrel 1.5mg", category: "Contraceptives", quantity: 150, unit: "units", reorderLevel: 30, unitPrice: 5000 },

    // 11. Gastrointestinal
    { drugName: "Omeprazole 20mg", genericName: "Omeprazole", category: "Gastrointestinal", quantity: 3000, unit: "capsules", reorderLevel: 600, unitPrice: 200 },
    { drugName: "Oral Rehydration Salts", genericName: "ORS", category: "Gastrointestinal", quantity: 3000, unit: "sachets", reorderLevel: 600, unitPrice: 500 },
    { drugName: "Zinc Sulfate 20mg", genericName: "Zinc Sulfate", category: "Gastrointestinal", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 100 },
    { drugName: "Metoclopramide 10mg", genericName: "Metoclopramide", category: "Gastrointestinal", quantity: 1500, unit: "tablets", reorderLevel: 300, unitPrice: 100 },
    { drugName: "Magnesium Trisilicate", genericName: "Antacid", category: "Gastrointestinal", quantity: 2000, unit: "tablets", reorderLevel: 400, unitPrice: 50 },
    { drugName: "Loperamide 2mg", genericName: "Loperamide", category: "Gastrointestinal", quantity: 1000, unit: "capsules", reorderLevel: 200, unitPrice: 150 },

    // 12. Anesthesia drugs
    { drugName: "Lidocaine 2% Injection", genericName: "Lidocaine", category: "Anesthesia", quantity: 400, unit: "vials", reorderLevel: 80, unitPrice: 3500 },
    { drugName: "Bupivacaine 0.5% Injection", genericName: "Bupivacaine", category: "Anesthesia", quantity: 200, unit: "vials", reorderLevel: 40, unitPrice: 12000 },
    { drugName: "Ketamine 50mg/ml Injection", genericName: "Ketamine", category: "Anesthesia", quantity: 150, unit: "vials", reorderLevel: 30, unitPrice: 15000 },
    { drugName: "Propofol 200mg/20ml Injection", genericName: "Propofol", category: "Anesthesia", quantity: 150, unit: "vials", reorderLevel: 30, unitPrice: 25000 },
    { drugName: "Diazepam 10mg Injection", genericName: "Diazepam", category: "Anesthesia", quantity: 200, unit: "ampoules", reorderLevel: 40, unitPrice: 2000 },
    { drugName: "Suxamethonium 100mg Injection", genericName: "Suxamethonium", category: "Anesthesia", quantity: 100, unit: "vials", reorderLevel: 20, unitPrice: 8000 },
    { drugName: "Adrenaline (Epinephrine) 1mg/ml Injection", genericName: "Adrenaline", category: "Anesthesia", quantity: 300, unit: "ampoules", reorderLevel: 60, unitPrice: 3000 },
    { drugName: "Atropine Sulfate 1mg/ml Injection", genericName: "Atropine", category: "Anesthesia", quantity: 300, unit: "ampoules", reorderLevel: 60, unitPrice: 2500 },

    // 13. Surgical consumables
    { drugName: "Surgical Gloves (Sterile) Size 7.5", genericName: "Latex Surgical Gloves", category: "Surgical Consumables", quantity: 3000, unit: "units", reorderLevel: 600, unitPrice: 800 },
    { drugName: "Absorbable Suture Vicryl 2/0", genericName: "Polyglactin 910", category: "Surgical Consumables", quantity: 500, unit: "units", reorderLevel: 100, unitPrice: 6000 },
    { drugName: "Non-Absorbable Suture Silk 2/0", genericName: "Silk Suture", category: "Surgical Consumables", quantity: 500, unit: "units", reorderLevel: 100, unitPrice: 4500 },
    { drugName: "Surgical Gauze Swabs 10x10cm", genericName: "Gauze", category: "Surgical Consumables", quantity: 4000, unit: "units", reorderLevel: 800, unitPrice: 300 },
    { drugName: "IV Cannula 18G", genericName: "IV Cannula", category: "Surgical Consumables", quantity: 1000, unit: "units", reorderLevel: 200, unitPrice: 1200 },
    { drugName: "Scalp Vein Set 23G (Butterfly Needle)", genericName: "Scalp Vein Set", category: "Surgical Consumables", quantity: 800, unit: "units", reorderLevel: 160, unitPrice: 800 },
    { drugName: "Surgical Blade No. 22", genericName: "Scalpel Blade", category: "Surgical Consumables", quantity: 600, unit: "units", reorderLevel: 120, unitPrice: 500 },
    { drugName: "Urinary Catheter Foley 16Fr", genericName: "Foley Catheter", category: "Surgical Consumables", quantity: 300, unit: "units", reorderLevel: 60, unitPrice: 5000 },
    { drugName: "Surgical Drapes (Sterile)", genericName: "Sterile Drape", category: "Surgical Consumables", quantity: 600, unit: "units", reorderLevel: 120, unitPrice: 2500 },
    { drugName: "Adhesive Dressing (Sterile) 10x10cm", genericName: "Sterile Dressing", category: "Surgical Consumables", quantity: 1500, unit: "units", reorderLevel: 300, unitPrice: 700 },
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
