import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── Business ──────────────────────────────────────────────
  const business = await db.business.upsert({
    where: { ein: "12-3456789" },
    update: {},
    create: {
      name: "Green Valley Dispensary",
      legalName: "Green Valley Cannabis Inc.",
      ein: "12-3456789",
      phone: "3105551234",
      email: "admin@greenvalley.example",
      website: "https://greenvalley.example",
      street: "1234 Cannabis Ave",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      county: "Los Angeles",
    },
  });
  console.log(`  Business: ${business.name} (${business.id})`);

  // ── Premises ──────────────────────────────────────────────
  const premises = await db.premises.create({
    data: {
      businessId: business.id,
      name: "Green Valley - DTLA",
      street: "1234 Cannabis Ave",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      county: "Los Angeles",
      latitude: 34.0522,
      longitude: -118.2437,
      opensAt: "08:00",
      closesAt: "21:00",
      timezone: "America/Los_Angeles",
    },
  });
  console.log(`  Premises: ${premises.name} (${premises.id})`);

  // ── Admin User ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@greenvalley.example" },
    update: {},
    create: {
      email: "admin@greenvalley.example",
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
      phone: "3105551234",
      isActive: true,
      premisesId: premises.id,
      employeeId: "EMP-001",
      hireDate: new Date("2025-01-15"),
    },
  });
  console.log(`  Admin: ${admin.email} (${admin.id})`);

  // ── Staff Users ───────────────────────────────────────────
  const staffHash = await bcrypt.hash("Staff123!", 12);

  const manager = await db.user.create({
    data: {
      email: "maria@greenvalley.example",
      passwordHash: staffHash,
      name: "Maria Santos",
      role: "MANAGER",
      isActive: true,
      premisesId: premises.id,
      employeeId: "EMP-002",
      hireDate: new Date("2025-02-01"),
    },
  });

  const cashier = await db.user.create({
    data: {
      email: "james@greenvalley.example",
      passwordHash: staffHash,
      name: "James Chen",
      role: "CASHIER",
      isActive: true,
      premisesId: premises.id,
      employeeId: "EMP-003",
      hireDate: new Date("2025-03-10"),
    },
  });

  const receiver = await db.user.create({
    data: {
      email: "sarah@greenvalley.example",
      passwordHash: staffHash,
      name: "Sarah Kim",
      role: "RECEIVER",
      isActive: true,
      premisesId: premises.id,
      employeeId: "EMP-004",
      hireDate: new Date("2025-04-01"),
    },
  });

  const dispatcher = await db.user.create({
    data: {
      email: "alex@greenvalley.example",
      passwordHash: staffHash,
      name: "Alex Rivera",
      role: "DISPATCHER",
      isActive: true,
      premisesId: premises.id,
      employeeId: "EMP-005",
      hireDate: new Date("2025-05-15"),
    },
  });

  console.log(`  Staff: ${manager.name}, ${cashier.name}, ${receiver.name}, ${dispatcher.name}`);

  // ── DCC License ───────────────────────────────────────────
  const license = await db.license.create({
    data: {
      premisesId: premises.id,
      licenseType: "ADULT_USE_RETAIL",
      licenseNumber: "C10-0000001-LIC",
      status: "ACTIVE",
      issuedBy: "DCC",
      issuedAt: new Date("2025-06-01"),
      expiresAt: new Date("2027-06-01"),
      warningDays: 90,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const deliveryLicense = await db.license.create({
    data: {
      premisesId: premises.id,
      licenseType: "ADULT_USE_DELIVERY",
      licenseNumber: "C9-0000002-LIC",
      status: "ACTIVE",
      issuedBy: "DCC",
      issuedAt: new Date("2025-06-01"),
      expiresAt: new Date("2027-06-01"),
      warningDays: 90,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  console.log(`  Licenses: ${license.licenseNumber}, ${deliveryLicense.licenseNumber}`);

  // ── Local Authorization ───────────────────────────────────
  await db.localAuthorization.create({
    data: {
      premisesId: premises.id,
      authority: "City of Los Angeles",
      permitNumber: "CAN-LA-2025-00123",
      type: "Cannabis Business License",
      status: "ACTIVE",
      issuedAt: new Date("2025-05-01"),
      expiresAt: new Date("2026-05-01"),
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  // ── Local Rules (LA tax rates) ────────────────────────────
  await db.localRule.createMany({
    data: [
      {
        premisesId: premises.id,
        jurisdiction: "City of Los Angeles",
        ruleKey: "local_cannabis_tax_rate",
        ruleValue: "0.05",
        description: "City of LA local cannabis business tax (5%)",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      {
        premisesId: premises.id,
        jurisdiction: "City of Los Angeles",
        ruleKey: "delivery_allowed",
        ruleValue: "true",
        description: "Delivery permitted within city limits",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      {
        premisesId: premises.id,
        jurisdiction: "City of Los Angeles",
        ruleKey: "max_operating_hours",
        ruleValue: '{"open":"08:00","close":"22:00"}',
        description: "LA permits 8AM-10PM operations",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      {
        premisesId: premises.id,
        jurisdiction: "City of Los Angeles",
        ruleKey: "daily_purchase_limit_grams",
        ruleValue: "28.5",
        description: "Adult-use daily purchase limit (1 oz)",
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    ],
  });
  console.log("  Local rules: 4 rules configured");

  // ── Facility (Rooms & Locations) ──────────────────────────
  const salesFloor = await db.room.create({
    data: {
      premisesId: premises.id,
      name: "Sales Floor",
      type: "sales_floor",
      isLimitedAccess: false,
      hasSurveillance: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const vault = await db.room.create({
    data: {
      premisesId: premises.id,
      name: "Vault Room",
      type: "vault",
      isLimitedAccess: true,
      hasSurveillance: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const receivingRoom = await db.room.create({
    data: {
      premisesId: premises.id,
      name: "Receiving Bay",
      type: "receiving",
      isLimitedAccess: true,
      hasSurveillance: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const displayCase = await db.inventoryLocation.create({
    data: {
      premisesId: premises.id,
      roomId: salesFloor.id,
      name: "Display Case 1",
      barcode: "LOC-DC-001",
      isActive: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const shelfA = await db.inventoryLocation.create({
    data: {
      premisesId: premises.id,
      roomId: vault.id,
      name: "Shelf A-1",
      barcode: "LOC-SA-001",
      isActive: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const receivingBay = await db.inventoryLocation.create({
    data: {
      premisesId: premises.id,
      roomId: receivingRoom.id,
      name: "Receiving Dock",
      barcode: "LOC-RD-001",
      isActive: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  console.log(`  Facility: 3 rooms, 3 locations`);

  // ── Vendors ───────────────────────────────────────────────
  const vendor1 = await db.vendor.create({
    data: {
      type: "DISTRIBUTOR",
      name: "Pacific Coast Distribution",
      legalName: "Pacific Coast Cannabis Distribution LLC",
      licenseNumber: "C11-0000010-LIC",
      licenseStatus: "ACTIVE",
      licenseExpiresAt: new Date("2027-12-31"),
      contactName: "Mike Thompson",
      phone: "8185559876",
      email: "orders@pacificcoast.example",
      street: "5678 Distribution Way",
      city: "Vernon",
      state: "CA",
      zip: "90058",
      isApproved: true,
      approvedAt: new Date("2025-07-01"),
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const vendor2 = await db.vendor.create({
    data: {
      type: "BRAND",
      name: "SoCal Farms",
      legalName: "SoCal Farms Inc.",
      licenseNumber: "C1-0000020-LIC",
      licenseStatus: "ACTIVE",
      licenseExpiresAt: new Date("2027-09-30"),
      contactName: "Lisa Park",
      phone: "6195558765",
      email: "wholesale@socalfarms.example",
      street: "2468 Farm Rd",
      city: "Riverside",
      state: "CA",
      zip: "92501",
      isApproved: true,
      approvedAt: new Date("2025-08-01"),
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  console.log(`  Vendors: ${vendor1.name}, ${vendor2.name}`);

  // ── Products ──────────────────────────────────────────────
  const product1 = await db.productMaster.create({
    data: {
      vendorId: vendor2.id,
      name: "SoCal OG Flower",
      brand: "SoCal Farms",
      category: "FLOWER",
      description: "Premium indoor-grown OG Kush flower. Dense buds with earthy, pine aroma.",
      sku: "SCF-FLW-OG-3.5",
      complianceStatus: "APPROVED",
      requiresLabTest: true,
      isForAdultUse: true,
      isForMedicinal: true,
      unitPrice: 45.0,
      costPrice: 22.5,
      unitWeight: 3.5,
      unitOfMeasure: "gram",
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const product2 = await db.productMaster.create({
    data: {
      vendorId: vendor2.id,
      name: "Blue Dream Pre-Roll",
      brand: "SoCal Farms",
      category: "PRE_ROLL",
      description: "Single 1g pre-roll of Blue Dream sativa-dominant hybrid.",
      sku: "SCF-PR-BD-1G",
      complianceStatus: "APPROVED",
      requiresLabTest: true,
      isForAdultUse: true,
      isForMedicinal: false,
      unitPrice: 12.0,
      costPrice: 5.0,
      unitWeight: 1.0,
      unitOfMeasure: "gram",
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const product3 = await db.productMaster.create({
    data: {
      vendorId: vendor1.id,
      name: "Sunset Vape Cartridge",
      brand: "Pacific Coast",
      category: "VAPE",
      description: "0.5g live resin vape cartridge. Sunset Sherbet strain.",
      sku: "PCD-VP-SS-0.5",
      complianceStatus: "APPROVED",
      requiresLabTest: true,
      isForAdultUse: true,
      isForMedicinal: true,
      unitPrice: 35.0,
      costPrice: 15.0,
      unitWeight: 0.5,
      unitOfMeasure: "gram",
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const product4 = await db.productMaster.create({
    data: {
      vendorId: vendor1.id,
      name: "Chill Gummies 10pk",
      brand: "Pacific Coast",
      category: "EDIBLE",
      description: "10-pack mixed fruit gummies. 10mg THC per gummy, 100mg total.",
      sku: "PCD-ED-CG-10PK",
      complianceStatus: "APPROVED",
      requiresLabTest: true,
      isForAdultUse: true,
      isForMedicinal: true,
      unitPrice: 25.0,
      costPrice: 10.0,
      unitWeight: 50.0,
      unitOfMeasure: "each",
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const product5 = await db.productMaster.create({
    data: {
      vendorId: vendor2.id,
      name: "Relief Topical Balm",
      brand: "SoCal Farms",
      category: "TOPICAL",
      description: "2oz CBD-rich topical balm for localized relief. THC: <0.3%.",
      sku: "SCF-TP-RB-2OZ",
      complianceStatus: "APPROVED",
      requiresLabTest: true,
      isForAdultUse: true,
      isForMedicinal: true,
      unitPrice: 30.0,
      costPrice: 12.0,
      unitWeight: 56.7,
      unitOfMeasure: "each",
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  console.log(`  Products: 5 products created`);

  // ── Batches ───────────────────────────────────────────────
  const batch1 = await db.batch.create({
    data: {
      productMasterId: product1.id,
      vendorId: vendor2.id,
      batchNumber: "SCF-2026-001",
      manufacturingDate: new Date("2026-02-15"),
      expirationDate: new Date("2027-02-15"),
      testingStatus: "PASSED",
      testedAt: new Date("2026-02-20"),
      labName: "SC Labs",
      coaUrl: "https://sclabs.example/coa/SCF-2026-001",
      thcPercent: 24.5,
      cbdPercent: 0.8,
      totalCannabinoids: 28.3,
      passedTesting: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const batch2 = await db.batch.create({
    data: {
      productMasterId: product2.id,
      vendorId: vendor2.id,
      batchNumber: "SCF-2026-002",
      manufacturingDate: new Date("2026-02-20"),
      expirationDate: new Date("2027-02-20"),
      testingStatus: "PASSED",
      testedAt: new Date("2026-02-25"),
      labName: "SC Labs",
      coaUrl: "https://sclabs.example/coa/SCF-2026-002",
      thcPercent: 21.0,
      cbdPercent: 0.5,
      totalCannabinoids: 23.8,
      passedTesting: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const batch3 = await db.batch.create({
    data: {
      productMasterId: product3.id,
      vendorId: vendor1.id,
      batchNumber: "PCD-2026-001",
      manufacturingDate: new Date("2026-01-10"),
      expirationDate: new Date("2027-07-10"),
      testingStatus: "PASSED",
      testedAt: new Date("2026-01-15"),
      labName: "Anresco Laboratories",
      coaUrl: "https://anresco.example/coa/PCD-2026-001",
      thcPercent: 85.2,
      cbdPercent: 1.2,
      totalCannabinoids: 92.1,
      passedTesting: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const batch4 = await db.batch.create({
    data: {
      productMasterId: product4.id,
      vendorId: vendor1.id,
      batchNumber: "PCD-2026-002",
      manufacturingDate: new Date("2026-02-01"),
      expirationDate: new Date("2027-02-01"),
      testingStatus: "PASSED",
      testedAt: new Date("2026-02-05"),
      labName: "Anresco Laboratories",
      coaUrl: "https://anresco.example/coa/PCD-2026-002",
      thcPercent: 10.0,
      cbdPercent: 0.0,
      totalCannabinoids: 10.5,
      passedTesting: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const batch5 = await db.batch.create({
    data: {
      productMasterId: product5.id,
      vendorId: vendor2.id,
      batchNumber: "SCF-2026-003",
      manufacturingDate: new Date("2026-01-20"),
      expirationDate: new Date("2028-01-20"),
      testingStatus: "PASSED",
      testedAt: new Date("2026-01-25"),
      labName: "SC Labs",
      coaUrl: "https://sclabs.example/coa/SCF-2026-003",
      thcPercent: 0.2,
      cbdPercent: 15.0,
      totalCannabinoids: 18.5,
      passedTesting: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  console.log(`  Batches: 5 batches created`);

  // ── Packages (Inventory) ──────────────────────────────────
  const packages = await Promise.all([
    // OG Flower - 10 units on display
    db.package.create({
      data: {
        batchId: batch1.id,
        locationId: displayCase.id,
        metrcUid: "1A406030000A1B2C3D000001",
        state: "AVAILABLE",
        quantity: 10,
        initialQuantity: 10,
        unitOfMeasure: "each",
        packageDate: new Date("2026-03-01"),
        expiresAt: new Date("2027-02-15"),
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    // OG Flower - 25 units in vault
    db.package.create({
      data: {
        batchId: batch1.id,
        locationId: shelfA.id,
        metrcUid: "1A406030000A1B2C3D000002",
        state: "AVAILABLE",
        quantity: 25,
        initialQuantity: 25,
        unitOfMeasure: "each",
        packageDate: new Date("2026-03-01"),
        expiresAt: new Date("2027-02-15"),
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    // Pre-rolls - 50 on display
    db.package.create({
      data: {
        batchId: batch2.id,
        locationId: displayCase.id,
        metrcUid: "1A406030000A1B2C3D000003",
        state: "AVAILABLE",
        quantity: 50,
        initialQuantity: 50,
        unitOfMeasure: "each",
        packageDate: new Date("2026-03-01"),
        expiresAt: new Date("2027-02-20"),
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    // Vape carts - 20 on display
    db.package.create({
      data: {
        batchId: batch3.id,
        locationId: displayCase.id,
        metrcUid: "1A406030000A1B2C3D000004",
        state: "AVAILABLE",
        quantity: 20,
        initialQuantity: 20,
        unitOfMeasure: "each",
        packageDate: new Date("2026-02-15"),
        expiresAt: new Date("2027-07-10"),
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    // Gummies - 30 in vault
    db.package.create({
      data: {
        batchId: batch4.id,
        locationId: shelfA.id,
        metrcUid: "1A406030000A1B2C3D000005",
        state: "AVAILABLE",
        quantity: 30,
        initialQuantity: 30,
        unitOfMeasure: "each",
        packageDate: new Date("2026-02-10"),
        expiresAt: new Date("2027-02-01"),
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    // Topical - 15 on display
    db.package.create({
      data: {
        batchId: batch5.id,
        locationId: displayCase.id,
        metrcUid: "1A406030000A1B2C3D000006",
        state: "AVAILABLE",
        quantity: 15,
        initialQuantity: 15,
        unitOfMeasure: "each",
        packageDate: new Date("2026-02-01"),
        expiresAt: new Date("2028-01-20"),
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    // Incoming shipment - quarantined
    db.package.create({
      data: {
        batchId: batch1.id,
        locationId: receivingBay.id,
        metrcUid: "1A406030000A1B2C3D000007",
        state: "QUARANTINED",
        quantity: 50,
        initialQuantity: 50,
        unitOfMeasure: "each",
        packageDate: new Date("2026-03-10"),
        expiresAt: new Date("2027-02-15"),
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
  ]);
  console.log(`  Packages: ${packages.length} packages created`);

  // ── Sample Customers ──────────────────────────────────────
  await db.customer.create({
    data: {
      type: "ADULT_USE",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date("1990-05-15"),
      phone: "3105559001",
      email: "john.doe@example.com",
      idVerified: true,
      idVerifiedAt: new Date("2026-03-10"),
      idType: "drivers_license",
      idExpiration: new Date("2028-05-15"),
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  const medicalCustomer = await db.customer.create({
    data: {
      type: "MEDICINAL",
      firstName: "Jane",
      lastName: "Smith",
      dateOfBirth: new Date("2006-08-20"),
      phone: "3105559002",
      email: "jane.smith@example.com",
      idVerified: true,
      idVerifiedAt: new Date("2026-03-10"),
      idType: "state_id",
      idExpiration: new Date("2029-08-20"),
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  await db.patientRecord.create({
    data: {
      customerId: medicalCustomer.id,
      recommendationNumber: "REC-2026-00456",
      physicianName: "Dr. Garcia",
      issuedAt: new Date("2026-01-15"),
      expiresAt: new Date("2027-01-15"),
      county: "Los Angeles",
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });
  console.log("  Customers: 2 customers (1 adult-use, 1 medicinal with patient record)");

  // ── Audit Event (seed record) ─────────────────────────────
  await db.auditEvent.create({
    data: {
      userId: admin.id,
      userEmail: admin.email,
      userRole: admin.role,
      action: "seed",
      entity: "System",
      entityId: "seed",
      premisesId: premises.id,
      metadata: { description: "Database seeded with initial data" },
    },
  });

  console.log("\nSeed complete!");
  console.log("\n── Login Credentials ──────────────────────────");
  console.log("  Admin:    admin@greenvalley.example / Admin123!");
  console.log("  Manager:  maria@greenvalley.example / Staff123!");
  console.log("  Cashier:  james@greenvalley.example / Staff123!");
  console.log("  Receiver: sarah@greenvalley.example / Staff123!");
  console.log("  Dispatch: alex@greenvalley.example  / Staff123!");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
