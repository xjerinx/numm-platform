"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sync_1 = require("csv-parse/sync");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🚀 Starting NUMM database seeding...');
    // 1. Clear existing data
    await prisma.auditLog.deleteMany({});
    await prisma.duplicatePair.deleteMany({});
    await prisma.cpseMapping.deleteMany({});
    await prisma.harmonizedMaterial.deleteMany({});
    await prisma.material.deleteMany({});
    await prisma.apiKey.deleteMany({});
    await prisma.webhook.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('🧹 Cleaned existing tables.');
    // 2. Seed Users
    const passwordHashAdmin = await bcryptjs_1.default.hash('Admin@1234', 10);
    const passwordHashAnalyst = await bcryptjs_1.default.hash('Analyst@1234', 10);
    const passwordHashReviewer = await bcryptjs_1.default.hash('Review@1234', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@numm.gov.in',
            name: 'National Admin',
            password: passwordHashAdmin,
            role: 'SUPER_ADMIN',
            cpseCode: null,
        },
    });
    const analyst = await prisma.user.create({
        data: {
            email: 'analyst@ongc.in',
            name: 'ONGC Chief Materials Analyst',
            password: passwordHashAnalyst,
            role: 'CPSE_ANALYST',
            cpseCode: 'ONGC',
        },
    });
    const reviewer = await prisma.user.create({
        data: {
            email: 'reviewer@numm.gov.in',
            name: 'National Harmonization Reviewer',
            password: passwordHashReviewer,
            role: 'REVIEWER',
            cpseCode: null,
        },
    });
    console.log('👥 Seeded default users: Super Admin, CPSE Analyst (ONGC), Reviewer');
    // 3. Load Synthetic Materials CSV
    const csvPath = path_1.default.join(__dirname, '../data/cpse_material_master_synthetic.csv');
    if (!fs_1.default.existsSync(csvPath)) {
        console.error(`❌ CSV file not found at ${csvPath}`);
        return;
    }
    const fileContent = fs_1.default.readFileSync(csvPath, 'utf-8');
    const records = (0, sync_1.parse)(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
    console.log(`📦 Read ${records.length} material records from CSV.`);
    // Insert materials in batches
    const createdMaterials = [];
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize).map((r) => ({
            cpseCode: r.CPSE_Code || 'ONGC',
            materialNumber: r.Material_Number || `MAT-${Math.floor(100000 + Math.random() * 900000)}`,
            localDescription: r.Local_Description || 'Unspecified Material',
            localClassCode: r.Local_Class_Code || null,
            uom: r.UOM || 'NOS',
            status: r.Status || 'Active',
            unspscCommodity: r.UNSPSC_Commodity || null,
            unspscName: r.UNSPSC_Commodity_Name || null,
            confidenceScore: r.Confidence_Score ? parseFloat(r.Confidence_Score) : null,
            mappedBy: r.Mapped_By || null,
            nmcCode: null,
        }));
        for (const item of batch) {
            const created = await prisma.material.create({ data: item });
            createdMaterials.push(created);
        }
    }
    console.log(`✅ Successfully seeded ${createdMaterials.length} CPSE materials.`);
    // 4. Seed Harmonized Materials and NMC mappings
    const harmonizedTemplates = [
        {
            nmcCode: 'NMC-41115200-0001',
            standardDescription: 'FEED HORNS RADAR AND SONAR TRANSMISSION SENSOR ASSEMBLY',
            unspscCode: '41115202',
            unspscName: 'Feed horns',
            uom: 'BOX',
            approvedBy: 'reviewer@numm.gov.in',
            mappedCpses: [
                { cpseCode: 'ONGC', localMaterialNumber: 'ONG-343962' },
                { cpseCode: 'BHEL', localMaterialNumber: 'BHL-902144' },
            ],
        },
        {
            nmcCode: 'NMC-31111500-0002',
            standardDescription: 'STAINLESS STEEL PROFILE EXTRUSIONS GRADE 316L ASTM A276',
            unspscCode: '31111513',
            unspscName: 'Stainless steel profile extrusions',
            uom: 'SET',
            approvedBy: 'admin@numm.gov.in',
            mappedCpses: [
                { cpseCode: 'ONGC', localMaterialNumber: 'ONG-948749' },
                { cpseCode: 'SAIL', localMaterialNumber: 'SAI-441209' },
                { cpseCode: 'HAL', localMaterialNumber: 'HAL-558291' },
            ],
        },
        {
            nmcCode: 'NMC-47101500-0003',
            standardDescription: 'AMMONIA GAS DETECTOR AND REMOVAL UNIT HIGH-CAPACITY',
            unspscCode: '47101502',
            unspscName: 'Ammonia removal equipment',
            uom: 'MTR',
            approvedBy: 'reviewer@numm.gov.in',
            mappedCpses: [
                { cpseCode: 'ONGC', localMaterialNumber: 'ONG-865179' },
                { cpseCode: 'GAIL', localMaterialNumber: 'GAI-772901' },
            ],
        },
        {
            nmcCode: 'NMC-40151700-0004',
            standardDescription: 'CENTRIFUGAL PUMP COLUMN ASSEMBLY HEAVY INDUSTRIAL FLANGED',
            unspscCode: '40151735',
            unspscName: 'Pump column assembly',
            uom: 'SQM',
            approvedBy: 'reviewer@numm.gov.in',
            mappedCpses: [
                { cpseCode: 'ONGC', localMaterialNumber: 'ONG-183667' },
                { cpseCode: 'IOCL', localMaterialNumber: 'IOC-663812' },
                { cpseCode: 'NTPC', localMaterialNumber: 'NTP-391204' },
            ],
        },
        {
            nmcCode: 'NMC-41111700-0005',
            standardDescription: 'HIGH RESOLUTION TRANSMISSION ELECTRON MICROSCOPE (TEM) 200KV',
            unspscCode: '41111711',
            unspscName: 'Electron microscopes',
            uom: 'SET',
            approvedBy: 'admin@numm.gov.in',
            mappedCpses: [
                { cpseCode: 'ONGC', localMaterialNumber: 'ONG-207175' },
                { cpseCode: 'BEL', localMaterialNumber: 'BEL-119283' },
            ],
        },
    ];
    for (const h of harmonizedTemplates) {
        const harmonized = await prisma.harmonizedMaterial.create({
            data: {
                nmcCode: h.nmcCode,
                standardDescription: h.standardDescription,
                unspscCode: h.unspscCode,
                unspscName: h.unspscName,
                uom: h.uom,
                approvedBy: h.approvedBy,
                mappings: {
                    create: h.mappedCpses.map((m) => ({
                        cpseCode: m.cpseCode,
                        localMaterialNumber: m.localMaterialNumber,
                    })),
                },
            },
        });
        // Update corresponding materials with nmcCode
        for (const m of h.mappedCpses) {
            await prisma.material.updateMany({
                where: { materialNumber: m.localMaterialNumber },
                data: { nmcCode: h.nmcCode },
            });
        }
    }
    console.log(`✨ Seeded ${harmonizedTemplates.length} National Material Code (NMC) registrations.`);
    // 5. Seed Duplicate Pairs across CPSEs
    // Find pairs of materials across different CPSEs with high similarity
    const duplicatePairs = [
        {
            idxA: 0, // AIR VELOCITY AND TEMPERATURE MONITORS
            idxB: 6, // Srotinom Erutarepmet Dna Yticolev Ria
            similarity: 0.94,
            suggestedNmc: 'NMC-41112400-0101',
            status: 'PENDING',
        },
        {
            idxA: 2, // FEED HORNS
            idxB: 12,
            similarity: 0.88,
            suggestedNmc: 'NMC-41115200-0001',
            status: 'PENDING',
        },
        {
            idxA: 3, // STAINLESS STEEL PROFILE EXTRUSIONS
            idxB: 15,
            similarity: 0.82,
            suggestedNmc: 'NMC-31111500-0002',
            status: 'PENDING',
        },
        {
            idxA: 5, // GD-AMMONIA
            idxB: 20,
            similarity: 0.76,
            suggestedNmc: 'NMC-47101500-0003',
            status: 'PENDING',
        },
        {
            idxA: 7, // Pump Column Assembly
            idxB: 25,
            similarity: 0.91,
            suggestedNmc: 'NMC-40151700-0004',
            status: 'APPROVED',
            reviewedBy: 'reviewer@numm.gov.in',
            reviewedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
        },
        {
            idxA: 8, // Magnet Assy
            idxB: 30,
            similarity: 0.68,
            suggestedNmc: 'NMC-31111900-0105',
            status: 'PENDING',
        },
        {
            idxA: 10,
            idxB: 35,
            similarity: 0.74,
            suggestedNmc: 'NMC-40141600-0106',
            status: 'REJECTED',
            reviewedBy: 'reviewer@numm.gov.in',
            reviewedAt: new Date(Date.now() - 3600 * 1000 * 24 * 3),
        },
    ];
    for (const dp of duplicatePairs) {
        if (createdMaterials[dp.idxA] && createdMaterials[dp.idxB]) {
            await prisma.duplicatePair.create({
                data: {
                    materialAId: createdMaterials[dp.idxA].id,
                    materialBId: createdMaterials[dp.idxB].id,
                    similarity: dp.similarity,
                    suggestedNmc: dp.suggestedNmc,
                    status: dp.status,
                    reviewedBy: dp.reviewedBy || null,
                    reviewedAt: dp.reviewedAt || null,
                },
            });
        }
    }
    console.log(`🔗 Seeded detected duplicate pairs.`);
    // 6. Seed Audit Logs
    const auditLogs = [
        {
            userId: admin.id,
            action: 'SYSTEM_INITIALIZATION',
            entity: 'Platform',
            entityId: 'NUMM-ROOT',
            oldValue: null,
            newValue: JSON.stringify({ status: 'Initialized', version: '1.0.0', cpseCount: 10 }),
            createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 7),
        },
        {
            userId: analyst.id,
            action: 'MATERIAL_CATALOG_UPLOAD',
            entity: 'Material',
            entityId: 'BATCH-ONGC-2026-001',
            oldValue: null,
            newValue: JSON.stringify({ filename: 'cpse_material_master_synthetic.csv', totalCount: 909 }),
            createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 5),
        },
        {
            userId: reviewer.id,
            action: 'DUPLICATE_PAIR_APPROVE',
            entity: 'DuplicatePair',
            entityId: 'PAIR-40151700-0004',
            oldValue: JSON.stringify({ status: 'PENDING' }),
            newValue: JSON.stringify({ status: 'APPROVED', suggestedNmc: 'NMC-40151700-0004' }),
            createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
        },
        {
            userId: reviewer.id,
            action: 'HARMONIZED_NMC_REGISTER',
            entity: 'HarmonizedMaterial',
            entityId: 'NMC-41115200-0001',
            oldValue: null,
            newValue: JSON.stringify({ standardDescription: 'FEED HORNS RADAR AND SONAR TRANSMISSION SENSOR ASSEMBLY' }),
            createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 1),
        },
    ];
    for (const log of auditLogs) {
        await prisma.auditLog.create({ data: log });
    }
    console.log(`📜 Seeded historical audit log entries.`);
    // 7. Seed API Keys & Webhook Integrations
    await prisma.apiKey.create({
        data: {
            name: 'ONGC ERP Connector Production',
            key: 'numm_live_ongc_89f0293847291048201',
            cpseCode: 'ONGC',
            status: 'ACTIVE',
            lastUsed: new Date(Date.now() - 3600 * 1000 * 2),
        },
    });
    await prisma.apiKey.create({
        data: {
            name: 'BHEL SAP S/4HANA Master Sync',
            key: 'numm_live_bhel_5729104820194820194',
            cpseCode: 'BHEL',
            status: 'ACTIVE',
            lastUsed: new Date(Date.now() - 3600 * 1000 * 6),
        },
    });
    await prisma.webhook.create({
        data: {
            url: 'https://erp.ongc.co.in/api/v2/webhooks/numm-sync',
            events: 'nmc.created,nmc.updated,duplicate.resolved',
            secret: 'whsec_ongc_national_sync_key_9921',
            status: 'ACTIVE',
        },
    });
    console.log(`🔌 Seeded SAP/ERP integration API keys & webhooks.`);
    console.log('🎉 Database seeding complete!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
