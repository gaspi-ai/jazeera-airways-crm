import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('✈️ Cleaning existing Jazeera Airways CRM database...');
  await prisma.proofOfPerformance.deleteMany({});
  await prisma.bookingSlot.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.inventoryAsset.deleteMany({});

  console.log('📌 Seeding Jazeera Airways Media Rate Cards & Assets...');

  const assetsData = [
    // --- In-Flight Media ---
    {
      code: 'AC-WRAP-01',
      name: 'Airbus A320 Airplane Full Fuselage Wrap',
      environment: 'INFLIGHT',
      category: 'WRAP',
      locationDesc: 'A320 Cabin & Exterior Flying Billboard Across 60+ Routes',
      dimensions: '37.5m x 4m (Full Aircraft Livery / 150 sqm)',
      totalUnits: 24,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 25000,
      baseRate3M: 65000,
      baseRate6M: 120000,
      baseRate12M: 180000,
      productionLeadWeeks: 6,
      status: 'AVAILABLE',
      technicalSpecs: 'Aviation-grade 3M Aircraft Exterior Polyurethane Film. Certified for high-altitude thermal pressure (-55°C to +85°C). Includes printing & installation.',
      safetyComplianceReq: 'EASA CS-25 & FAR 25.853 Flammability Approved. DGCA Aircraft Modification Permit required.',
      imageUrl: '/assets/plane-wrap.jpg',
    },
    {
      code: 'AC-SEAT-01',
      name: 'Seatback Device & Tray Table Stickers',
      environment: 'INFLIGHT',
      category: 'SEATBACK',
      locationDesc: 'A320 Fleet Passenger Cabins (1-on-1 Dwell Engagement)',
      dimensions: '20cm x 12cm Anti-Microbial Film',
      totalUnits: 24, // 24 fleet aircraft, ~162 seats each
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 1400,
      baseRate3M: 4000,
      baseRate6M: 7500,
      baseRate12M: 14000,
      productionLeadWeeks: 3,
      status: 'AVAILABLE',
      technicalSpecs: 'Direct passenger line-of-sight for 2 to 5 hours average flight duration. Anti-bacterial coating.',
      safetyComplianceReq: 'FAR 25.853 Appendix F Part I 12-second vertical flammability compliance. Removable adhesive certified zero residue.',
      imageUrl: '/assets/seatback.jpg',
    },
    {
      code: 'AC-BIN-01',
      name: 'Overhead Cabin Baggage Bins',
      environment: 'INFLIGHT',
      category: 'OVERHEAD_BIN',
      locationDesc: 'A320 Full Aircraft Interior Cabin Overhead Lockers',
      dimensions: '120cm x 30cm per bin face (28 faces per aircraft)',
      totalUnits: 24,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 2200,
      baseRate3M: 5500,
      baseRate6M: 8000,
      baseRate12M: 15000,
      productionLeadWeeks: 4,
      status: 'AVAILABLE',
      technicalSpecs: 'Dominates passenger cabin view during boarding, flight, and disembarkation. High saturation print.',
      safetyComplianceReq: 'JAR-25 Cabin Flammability Compliance. Low-smoke emission polymer film.',
      imageUrl: '/assets/overhead-bin.jpg',
    },
    {
      code: 'IF-SCR-01',
      name: 'Jazeera Screen (In-Flight Digital IFE Video & Splash)',
      environment: 'INFLIGHT',
      category: 'DIGITAL_SCREEN',
      locationDesc: 'In-Flight Wireless IFE Streamed to Passenger Devices Fleet-Wide',
      dimensions: '1080p HD Video (15s/30s) + Interactive Web Splash Banner',
      totalUnits: 24,
      isDigitalLoop: true,
      loopMaxClients: 6,
      baseRate1M: 2500,
      baseRate3M: 6800,
      baseRate6M: 12500,
      baseRate12M: 23000,
      productionLeadWeeks: 1,
      status: 'AVAILABLE',
      technicalSpecs: '>60% Passenger Reach across all flights. Mandatory interstitial pre-roll before movie/entertainment access.',
      safetyComplianceReq: 'DGCA In-Flight Broadcast Content Guidelines. Zero RF interference streaming.',
      imageUrl: '/assets/jazeera-screen.jpg',
    },
    {
      code: 'MAG-FPC-01',
      name: 'Jazeera Inflight Magazine (Full Page Color / FPC)',
      environment: 'INFLIGHT',
      category: 'MAGAZINE',
      locationDesc: 'Placed in 100% of Seatback Pockets Across Entire A320 Fleet',
      dimensions: '210mm x 280mm Full Page Color (Trim + 3mm Bleed)',
      totalUnits: 25000,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 1250,
      baseRate3M: 3400,
      baseRate6M: 6200,
      baseRate12M: 11500,
      productionLeadWeeks: 3,
      status: 'AVAILABLE',
      technicalSpecs: '25,000 monthly printed copies. High luxury stock paper. DPS: 1,750 KWD | IFC: 1,750 KWD | IBC: 1,450 KWD | OBC: 2,100 KWD.',
      safetyComplianceReq: 'Aviation lightweight low-smoke paper certified stock.',
      imageUrl: '/assets/magazine.jpg',
    },

    // --- Direct Passenger Touchpoints ---
    {
      code: 'BP-REV-01',
      name: 'Physical Boarding Passes (Reverse Side Branding)',
      environment: 'DIGITAL_PRINT',
      category: 'BOARDING_PASS',
      locationDesc: 'Issued to Every Checked-in Passenger at T5 & International Outstations',
      dimensions: '203mm x 82.5mm Thermal Magnetic Cardstock',
      totalUnits: 500000,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 9000, // 500k units (~45 days) = 9,000 KWD | 1M units = 12,500 KWD
      baseRate3M: 12500,
      baseRate6M: 22000,
      baseRate12M: 40000,
      productionLeadWeeks: 4,
      status: 'AVAILABLE',
      technicalSpecs: '100% passenger holding retention from check-in through security, gate boarding, and seat inspection. High coupon redemption rate.',
      safetyComplianceReq: 'Kuwait DGCA & IATA Resolution 722e Scanner Barcode Contrast & Reflection Non-Interference Certified.',
      imageUrl: '/assets/boarding-pass.jpg',
    },
    {
      code: 'ET-CONF-01',
      name: 'E-Ticket Itinerary & Confirmation Email Banners',
      environment: 'DIGITAL_PRINT',
      category: 'E_TICKET',
      locationDesc: 'Direct Delivery to All Jazeera Web & App Booking Confirmations',
      dimensions: '728x90 Header Banner + 600x250 Confirmation Body Banner',
      totalUnits: 400000,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 2250,
      baseRate3M: 6000,
      baseRate6M: 11000,
      baseRate12M: 20000,
      productionLeadWeeks: 1,
      status: 'AVAILABLE',
      technicalSpecs: 'Reaches 350,000 to 400,000 verified booking passengers every month. High click-through rate to e-commerce and banking portals.',
      safetyComplianceReq: 'Anti-Spam GDPR & Kuwait Electronic Transactions Law Compliant.',
      imageUrl: '/assets/eticket.jpg',
    },

    // --- Terminal 5 (T5) Airport Ground Media ---
    {
      code: 'T5-CHK-01',
      name: 'Check-in Counter Wraps (Full Terminal Dominance)',
      environment: 'T5_GROUND',
      category: 'WRAP',
      locationDesc: 'Facing 100% of Departing Passengers in T5 Main Check-In Hall',
      dimensions: '43 branding boards (1.2m x 0.9m each)',
      totalUnits: 43,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 7500,
      baseRate3M: 20000,
      baseRate6M: 35000,
      baseRate12M: 60000,
      productionLeadWeeks: 4,
      status: 'AVAILABLE',
      technicalSpecs: 'Guaranteed 100% departure dwell viewing. High traffic front-counter dominance.',
      safetyComplianceReq: 'Terminal 5 Facilities & Directorate General of Civil Aviation Fire Marshall Class A compliance.',
      imageUrl: '/assets/checkin-wrap.jpg',
    },
    {
      code: 'T5-TR-01',
      name: 'Fleet of 550 Baggage Trolleys',
      environment: 'T5_GROUND',
      category: 'TROLLEY',
      locationDesc: 'Circulating Terminal 5 Curbside, Check-in Hall, Baggage Reclaim & Parking',
      dimensions: '550 Mobile Units (Double Sided 48cm x 28cm high-impact panels)',
      totalUnits: 550,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 3500,
      baseRate3M: 8500,
      baseRate6M: 14000,
      baseRate12M: 24000,
      productionLeadWeeks: 4,
      status: 'AVAILABLE',
      technicalSpecs: '550 constantly moving billboards carried by passengers across all indoor and outdoor terminal zones.',
      safetyComplianceReq: 'Impact resistant poly-shield safety certified for airport luggage concourses.',
      imageUrl: '/assets/trolleys.jpg',
    },
    {
      code: 'T5-MS-01',
      name: 'Departures Main Concourse Mega Screen',
      environment: 'T5_GROUND',
      category: 'DIGITAL_SCREEN',
      locationDesc: 'Positioned Directly Behind Main Check-in Counters Facing All Departures',
      dimensions: '19m x 2.5m (47.5 sqm) Ultra-HD P2.5 Curved LED',
      totalUnits: 1,
      isDigitalLoop: true,
      loopMaxClients: 6,
      baseRate1M: 7500,
      baseRate3M: 21000,
      baseRate6M: 39000,
      baseRate12M: 72000,
      productionLeadWeeks: 1,
      status: 'AVAILABLE',
      technicalSpecs: 'Flagship digital media asset in Kuwait. 10-second spot inside a synchronized 60-second loop. 1,440 daily broadcasts.',
      safetyComplianceReq: 'EMC Directive 2014/30/EU & DGCA Terminal Optical Safety Standard.',
      imageUrl: '/assets/mega-screen.jpg',
    },
    {
      code: 'T5-DF-01',
      name: 'Duty Free Central Digital Screen',
      environment: 'T5_GROUND',
      category: 'DIGITAL_SCREEN',
      locationDesc: 'Terminal 5 Duty Free & Luxury Retail Plaza',
      dimensions: '4.5m x 2m (9 sqm) High Refresh Rate LED',
      totalUnits: 1,
      isDigitalLoop: true,
      loopMaxClients: 6,
      baseRate1M: 5500,
      baseRate3M: 15000,
      baseRate6M: 28000,
      baseRate12M: 52000,
      productionLeadWeeks: 1,
      status: 'AVAILABLE',
      technicalSpecs: 'High spending intent zone. Reaches passengers while browsing luxury perfumes, confectionery, and electronics.',
      safetyComplianceReq: 'Retail concourse electrical and fire compliance certified.',
      imageUrl: '/assets/dutyfree-screen.jpg',
    },
    {
      code: 'T5-LB-DEP',
      name: 'Departures Area Static Lightboxes (4 Faces)',
      environment: 'T5_GROUND',
      category: 'LIGHTBOX',
      locationDesc: 'Terminal 5 Departures Concourse Walkways',
      dimensions: '4 units: 2m x 1.5m to 4.6m x 1.2m backlit',
      totalUnits: 4,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 10000,
      baseRate3M: 27500,
      baseRate6M: 52000,
      baseRate12M: 96000,
      productionLeadWeeks: 3,
      status: 'AVAILABLE',
      technicalSpecs: 'High lumen edge-lit LED lightboxes with vibrant Duratrans tension media.',
      safetyComplianceReq: 'UL/CE Class 1 Fire Retardant Backlit Canvas.',
      imageUrl: '/assets/lightbox-dep.jpg',
    },
    {
      code: 'T5-LB-SKY',
      name: 'Departures Sky Bridge Lightboxes (3 Faces)',
      environment: 'T5_GROUND',
      category: 'LIGHTBOX',
      locationDesc: 'Connecting Multi-Story Car Park Directly to T5 Departures Entrance',
      dimensions: '3 units: 3m x 1.4m, 2m x 1.4m, 3.1m x 2.1m',
      totalUnits: 3,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 7500,
      baseRate3M: 21000,
      baseRate6M: 39000,
      baseRate12M: 72000,
      productionLeadWeeks: 3,
      status: 'AVAILABLE',
      technicalSpecs: 'First visual contact for 65%+ of departing passengers arriving via car and taxi.',
      safetyComplianceReq: 'Pedestrian corridor anti-glare safety verified.',
      imageUrl: '/assets/lightbox-sky.jpg',
    },
    {
      code: 'T5-LB-GATE',
      name: 'Boarding Gate Waiting Area Lightboxes (3 Units)',
      environment: 'T5_GROUND',
      category: 'LIGHTBOX',
      locationDesc: 'Directly Facing Passenger Waiting Lounges at Gates 1, 2, and 3',
      dimensions: '3 units: 3.1m x 1.1m Slimline LED Backlit',
      totalUnits: 3,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 6000,
      baseRate3M: 16500,
      baseRate6M: 31000,
      baseRate12M: 58000,
      productionLeadWeeks: 3,
      status: 'AVAILABLE',
      technicalSpecs: 'Captive audience with 30-45 minutes dwell time prior to boarding.',
      safetyComplianceReq: 'Aviation security line of sight clearance verified.',
      imageUrl: '/assets/lightbox-gate.jpg',
    },
    {
      code: 'T5-DS-CAR',
      name: 'Arrivals Baggage Carousel Digital Screens (4 Units)',
      environment: 'T5_GROUND',
      category: 'DIGITAL_SCREEN',
      locationDesc: 'Mounts on Baggage Belts 1, 2, 3, and 4 in Arrivals Hall',
      dimensions: '4x 75-inch Ultra HD 4K Commercial Displays',
      totalUnits: 4,
      isDigitalLoop: true,
      loopMaxClients: 6,
      baseRate1M: 6000,
      baseRate3M: 16500,
      baseRate6M: 31000,
      baseRate12M: 58000,
      productionLeadWeeks: 1,
      status: 'AVAILABLE',
      technicalSpecs: 'Captures 100% of returning residents and arriving tourists during 20-30 minute baggage wait.',
      safetyComplianceReq: 'Airport Baggage Hall IP54 dust protection compliant.',
      imageUrl: '/assets/arrival-screens.jpg',
    },
    {
      code: 'T5-LB-CLM',
      name: 'Arrivals Baggage Claim Wall Lightboxes (4 Units)',
      environment: 'T5_GROUND',
      category: 'LIGHTBOX',
      locationDesc: 'Main Perimeter Walls of Arrivals Reclaim Hall',
      dimensions: '4 units: 3m x 2m & 4m x 1.5m Large Format Backlit',
      totalUnits: 4,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 12000,
      baseRate3M: 33000,
      baseRate6M: 62000,
      baseRate12M: 115000,
      productionLeadWeeks: 4,
      status: 'AVAILABLE',
      technicalSpecs: 'Massive scale welcoming passengers arriving from GCC, Levant, and Indian subcontinent destinations.',
      safetyComplianceReq: 'Civil aviation building code fire retardancy certified.',
      imageUrl: '/assets/lightbox-clm.jpg',
    },
    {
      code: 'T5-LB-TRF',
      name: 'Flight Transfers & Connecting Corridor Lightboxes (3 Units)',
      environment: 'T5_GROUND',
      category: 'LIGHTBOX',
      locationDesc: 'Connecting Transit Corridor between International Gates and Transfer Security',
      dimensions: '3 units: 3.1m x 1.1m Tension Fabric Backlit',
      totalUnits: 3,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 7500,
      baseRate3M: 21000,
      baseRate6M: 39000,
      baseRate12M: 72000,
      productionLeadWeeks: 3,
      status: 'AVAILABLE',
      technicalSpecs: 'Strategic targeting for transit passengers connecting to Cairo, Dubai, Riyadh, and Istanbul.',
      safetyComplianceReq: 'Transit security clearway compliance verified.',
      imageUrl: '/assets/lightbox-transit.jpg',
    },
    {
      code: 'T5-LB-EXT',
      name: 'Arrivals Exit Concourse Lightboxes (2 Units)',
      environment: 'T5_GROUND',
      category: 'LIGHTBOX',
      locationDesc: 'Final Exit Concourse Facing Greeters, Taxi Pickup & Arrivals Hall',
      dimensions: '2 units: 3m x 2m / 2m x 3m Eye-level Backlit Units',
      totalUnits: 2,
      isDigitalLoop: false,
      loopMaxClients: 1,
      baseRate1M: 5500,
      baseRate3M: 15000,
      baseRate6M: 28000,
      baseRate12M: 52000,
      productionLeadWeeks: 3,
      status: 'AVAILABLE',
      technicalSpecs: 'Dual exposure targeting arriving passengers and hundreds of awaiting family members and drivers.',
      safetyComplianceReq: 'High traffic exit lane obstruction-free safety sign-off.',
      imageUrl: '/assets/lightbox-exit.jpg',
    },
    {
      code: 'T5-DS-PRK',
      name: 'Parking Roof Top Outdoor Mega Screen',
      environment: 'T5_GROUND',
      category: 'DIGITAL_SCREEN',
      locationDesc: 'Terminal 5 Multi-Level Parking Rooftop Facing Highway & Airport Approach Road',
      dimensions: '14m x 4m (56 sqm) High-Brightness IP67 Outdoor LED',
      totalUnits: 1,
      isDigitalLoop: true,
      loopMaxClients: 6,
      baseRate1M: 5750,
      baseRate3M: 16000,
      baseRate6M: 30000,
      baseRate12M: 56000,
      productionLeadWeeks: 1,
      status: 'AVAILABLE',
      technicalSpecs: 'High-impact visibility from Airport Road 55 and Terminal 5 vehicle approach viaduct. 7,000 nits daylight visibility.',
      safetyComplianceReq: 'Kuwait Civil Aviation (DGCA) Obstacle Light & Flight Path Optical Safety Approved.',
      imageUrl: '/assets/parking-mega.jpg',
    },
    {
      code: 'T5-DS-UBR',
      name: 'Parking Under Bridge Digital Screen',
      environment: 'T5_GROUND',
      category: 'DIGITAL_SCREEN',
      locationDesc: 'Terminal 5 Under-Bridge Ground Transportation & Valet Driveway',
      dimensions: '10m x 2m Wide Aspect Outdoor LED Ribbon',
      totalUnits: 1,
      isDigitalLoop: true,
      loopMaxClients: 6,
      baseRate1M: 4500,
      baseRate3M: 12500,
      baseRate6M: 23500,
      baseRate12M: 44000,
      productionLeadWeeks: 1,
      status: 'AVAILABLE',
      technicalSpecs: 'Continuous viewing for passenger drop-offs, VIP valet, and taxi staging lanes.',
      safetyComplianceReq: 'Traffic safety non-distraction luminance modulation certified.',
      imageUrl: '/assets/underbridge.jpg',
    },
  ];

  const createdAssets: Record<string, any> = {};
  for (const asset of assetsData) {
    const created = await prisma.inventoryAsset.create({
      data: asset,
    });
    createdAssets[created.code] = created;
  }
  console.log(`✅ Seeded ${Object.keys(createdAssets).length} inventory assets.`);

  // --- Seed Companies (Agencies & Direct Clients) ---
  console.log('🏢 Seeding Companies & Contacts...');
  const nbk = await prisma.company.create({
    data: {
      name: 'National Bank of Kuwait (NBK)',
      type: 'DIRECT_CLIENT',
      industry: 'FINTECH_BANKING',
      contactEmail: 'media@nbk.com',
      phone: '+965 2229 1111',
      billingAddress: 'NBK Head Office Tower, Al Shuhada St, Sharq, Kuwait City',
      contacts: {
        create: [
          {
            name: 'Nasser Al-Ghanim',
            role: 'Head of Brand & Media Partnerships',
            email: 'n.alghanim@nbk.com',
            phone: '+965 9988 1234',
          },
          {
            name: 'Reem Al-Sabah',
            role: 'Senior Campaign Manager',
            email: 'reem.alsabah@nbk.com',
            phone: '+965 9772 3456',
          },
        ],
      },
    },
    include: { contacts: true },
  });

  const zain = await prisma.company.create({
    data: {
      name: 'Zain Telecom Kuwait',
      type: 'DIRECT_CLIENT',
      industry: 'TELCO',
      contactEmail: 'advertising@kw.zain.com',
      phone: '+965 2464 4444',
      billingAddress: 'Zain HQ Campus, Shuwaikh, Kuwait City',
      contacts: {
        create: [
          {
            name: 'Tareq Al-Mutawa',
            role: 'Marketing Communications Director',
            email: 'tareq.mutawa@kw.zain.com',
            phone: '+965 9912 3344',
          },
        ],
      },
    },
    include: { contacts: true },
  });

  const impactBbdo = await prisma.company.create({
    data: {
      name: 'Impact BBDO Kuwait',
      type: 'AGENCY',
      industry: 'OTHER',
      contactEmail: 'planning@impactbbdo.com.kw',
      phone: '+965 2246 8000',
      billingAddress: 'Dar Al-Awadi Complex, 18th Floor, Sharq, Kuwait City',
      contacts: {
        create: [
          {
            name: 'Fadi Khoury',
            role: 'Media Planning Director',
            email: 'fadi.khoury@bbdo.com.kw',
            phone: '+965 9944 5566',
          },
          {
            name: 'Maya Haddad',
            role: 'Senior Media Buyer',
            email: 'maya.haddad@bbdo.com.kw',
            phone: '+965 9788 1122',
          },
        ],
      },
    },
    include: { contacts: true },
  });

  const mindshare = await prisma.company.create({
    data: {
      name: 'Mindshare MENA (Kuwait Branch)',
      type: 'AGENCY',
      industry: 'OTHER',
      contactEmail: 'kuwait.planning@mindshareworld.com',
      phone: '+965 2291 3500',
      billingAddress: 'Salhia Commercial Complex, Gate 4, Kuwait City',
      contacts: {
        create: [
          {
            name: 'Karim Mansour',
            role: 'Client Account Director',
            email: 'karim.mansour@mindshareworld.com',
            phone: '+965 9965 4321',
          },
        ],
      },
    },
    include: { contacts: true },
  });

  const talabat = await prisma.company.create({
    data: {
      name: 'Talabat Kuwait (Delivery Hero)',
      type: 'DIRECT_CLIENT',
      industry: 'RETAIL',
      contactEmail: 'marketing.kw@talabat.com',
      phone: '+965 1800 200',
      billingAddress: 'Arraya Center, Tower 1, Sharq, Kuwait City',
      contacts: {
        create: [
          {
            name: 'Yousef Bouresli',
            role: 'Regional Brand Lead',
            email: 'yousef.b@talabat.com',
            phone: '+965 9901 8877',
          },
        ],
      },
    },
    include: { contacts: true },
  });

  const kfh = await prisma.company.create({
    data: {
      name: 'Kuwait Finance House (KFH)',
      type: 'DIRECT_CLIENT',
      industry: 'FINTECH_BANKING',
      contactEmail: 'pr@kfh.com',
      phone: '+965 1803 333',
      billingAddress: 'Abdullah Al-Mubarak St, Mirqab, Kuwait City',
      contacts: {
        create: [
          {
            name: 'Khaled Al-Bahar',
            role: 'Director of Corporate Communications',
            email: 'k.albahar@kfh.com',
            phone: '+965 9933 2211',
          },
        ],
      },
    },
    include: { contacts: true },
  });

  console.log('💼 Seeding Deals across Sales Pipeline Stages...');

  // Deal 1: CLOSED_WON - NBK Q1/Q2 Flagship Departures Mega Screen & In-Flight IFE
  const deal1 = await prisma.deal.create({
    data: {
      dealCode: 'JZ-2026-001',
      title: 'NBK "Weyay Digital Bank" Airport Takeover & IFE Sponsorship',
      companyId: nbk.id,
      contactId: nbk.contacts[0].id,
      stage: 'CLOSED_WON',
      totalValueKWD: 58500,
      targetStartDate: new Date('2026-04-01'),
      targetEndDate: new Date('2026-09-30'),
      aviationApproval: true,
      flammabilityCertified: true,
      scannerChecked: true,
      dgcaPermitNo: 'DGCA-MED-2026-041',
      aviationSafetyNotes: 'All creative motion and luminance levels audited by DGCA. Non-distracting contrast certified.',
      notes: 'Strategic high-yield partnership with Add Effect Advertising.',
      bookingSlots: {
        create: [
          {
            assetId: createdAssets['T5-MS-01'].id,
            startDate: new Date('2026-04-01'),
            endDate: new Date('2026-09-30'),
            slotIndex: 1, // Slot 1 of 6 on Mega Screen
            agreedRateKWD: 39000, // 6 months package
            productionIncluded: true,
            notes: 'Slot 1: 10s spot every minute, 24/7.',
          },
          {
            assetId: createdAssets['IF-SCR-01'].id,
            startDate: new Date('2026-04-01'),
            endDate: new Date('2026-09-30'),
            slotIndex: 1,
            agreedRateKWD: 12500,
            productionIncluded: true,
            notes: 'Pre-roll video stream before wireless IFE session.',
          },
          {
            assetId: createdAssets['T5-DS-CAR'].id,
            startDate: new Date('2026-04-01'),
            endDate: new Date('2026-05-31'),
            slotIndex: 1,
            agreedRateKWD: 7000,
            productionIncluded: false,
            notes: 'Carousel 1-4 sync digital loops.',
          },
        ],
      },
      proofOfPerformances: {
        create: [
          {
            assetId: createdAssets['T5-MS-01'].id,
            flightNumberOrLocation: 'T5 Main Departures Concourse (P2.5 Mega Screen)',
            timestamp: new Date('2026-04-02T08:30:00Z'),
            photoUrls: JSON.stringify([
              'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1200&q=80'
            ]),
            certifiedBy: 'Capt. Tariq Al-Hajji (Jazeera Airport Ops Director)',
            inspectorRole: 'Terminal Operations & Media Compliance Lead',
            complianceStatus: 'VERIFIED',
            inspectionNotes: 'Screen luminance within 4,500 nits limit. Audio off, 10s loop playback operating flawlessly.',
          },
        ],
      },
    },
  });

  // Deal 2: IN_PRODUCTION - Zain Roaming Campaign (Check-in Wraps & Boarding Passes)
  const deal2 = await prisma.deal.create({
    data: {
      dealCode: 'JZ-2026-002',
      title: 'Zain "Global Roaming Pass" Check-in Hall & Boarding Pass Domination',
      companyId: zain.id,
      contactId: zain.contacts[0].id,
      stage: 'IN_PRODUCTION',
      totalValueKWD: 29000,
      targetStartDate: new Date('2026-05-01'),
      targetEndDate: new Date('2026-07-31'),
      aviationApproval: true,
      flammabilityCertified: true,
      scannerChecked: true,
      dgcaPermitNo: 'DGCA-MED-2026-088',
      aviationSafetyNotes: 'Boarding pass thermal stock verified with IATA Resolution 722e scanners at T5 Gates 1-6. Counter vinyl Class A fire retardancy documented.',
      notes: 'Artwork received from Zain design agency; 4-week printing lead time running currently.',
      bookingSlots: {
        create: [
          {
            assetId: createdAssets['T5-CHK-01'].id,
            startDate: new Date('2026-05-01'),
            endDate: new Date('2026-07-31'),
            slotIndex: 1,
            agreedRateKWD: 20000, // 3 months
            productionIncluded: false,
            notes: '43 Check-in counter wraps full wrap production underway.',
          },
          {
            assetId: createdAssets['BP-REV-01'].id,
            startDate: new Date('2026-05-01'),
            endDate: new Date('2026-06-15'),
            slotIndex: 1,
            agreedRateKWD: 9000, // 500k units
            productionIncluded: true,
            notes: '500,000 thermal cardstock passes arriving from accredited supplier.',
          },
        ],
      },
    },
  });

  // Deal 3: IO_SIGNED - KFH Wealth A320 Overhead Cabin Bins & Sky Bridge Lightboxes
  const deal3 = await prisma.deal.create({
    data: {
      dealCode: 'JZ-2026-003',
      title: 'KFH "Private Banking Excellence" Sky Bridge & Overhead Cabin Takeover',
      companyId: kfh.id,
      contactId: kfh.contacts[0].id,
      stage: 'IO_SIGNED',
      totalValueKWD: 47000,
      targetStartDate: new Date('2026-06-01'),
      targetEndDate: new Date('2026-11-30'),
      aviationApproval: true,
      flammabilityCertified: true,
      scannerChecked: true,
      dgcaPermitNo: 'DGCA-MED-2026-102',
      aviationSafetyNotes: 'FAR/JAR-25 cabin material flammability tests passed. Sky Bridge lightboxes approved by airport safety board.',
      notes: 'IO executed by KFH CEO Office and Add Effect Advertising.',
      bookingSlots: {
        create: [
          {
            assetId: createdAssets['AC-BIN-01'].id,
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-11-30'),
            slotIndex: 1,
            agreedRateKWD: 8000, // 6 months per AC (Fleet of 3 target aircraft)
            productionIncluded: true,
            notes: 'Aircraft tails: 9K-CAA, 9K-CAB, 9K-CAC.',
          },
          {
            assetId: createdAssets['T5-LB-SKY'].id,
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-11-30'),
            slotIndex: 1,
            agreedRateKWD: 39000, // 6 months Sky Bridge
            productionIncluded: false,
            notes: '3 units along high-dwell connecting sky bridge.',
          },
        ],
      },
    },
  });

  // Deal 4: AVIATION_SAFETY_APPROVAL - Talabat Seatback Stickers & Baggage Trolleys (Requires Approval Gate!)
  const deal4 = await prisma.deal.create({
    data: {
      dealCode: 'JZ-2026-004',
      title: 'Talabat "Travel Bites" Seatback & 550 Baggage Trolleys Campaign',
      companyId: talabat.id,
      contactId: talabat.contacts[0].id,
      stage: 'AVIATION_SAFETY_APPROVAL',
      totalValueKWD: 21500,
      targetStartDate: new Date('2026-07-01'),
      targetEndDate: new Date('2026-12-31'),
      aviationApproval: false, // NOTE: Safety approval pending! Blocks move to IO_SIGNED
      flammabilityCertified: false,
      scannerChecked: true,
      aviationSafetyNotes: 'Awaiting lab adhesive flammability certificate (FAR 25.853) for new orange vinyl batch.',
      notes: 'Must not advance to IO_SIGNED until safety checklist is cleared.',
      bookingSlots: {
        create: [
          {
            assetId: createdAssets['AC-SEAT-01'].id,
            startDate: new Date('2026-07-01'),
            endDate: new Date('2026-12-31'),
            slotIndex: 1,
            agreedRateKWD: 7500,
            productionIncluded: false,
          },
          {
            assetId: createdAssets['T5-TR-01'].id,
            startDate: new Date('2026-07-01'),
            endDate: new Date('2026-12-31'),
            slotIndex: 1,
            agreedRateKWD: 14000,
            productionIncluded: false,
          },
        ],
      },
    },
  });

  // Deal 5: MEDIA_PLAN_SENT - Impact BBDO / Luxury Watch Client (Duty Free Screen Slot 2 & Arrivals Lightboxes)
  const deal5 = await prisma.deal.create({
    data: {
      dealCode: 'JZ-2026-005',
      title: 'Impact BBDO - Luxury Horology Duty Free & Arrivals Domination',
      companyId: impactBbdo.id,
      contactId: impactBbdo.contacts[0].id,
      stage: 'MEDIA_PLAN_SENT',
      totalValueKWD: 43000,
      targetStartDate: new Date('2026-05-15'),
      targetEndDate: new Date('2026-08-15'),
      aviationApproval: false,
      notes: 'Proposal sent to agency client for 3-month summer travel season.',
      bookingSlots: {
        create: [
          {
            assetId: createdAssets['T5-DF-01'].id,
            startDate: new Date('2026-05-15'),
            endDate: new Date('2026-08-15'),
            slotIndex: 2, // Slot 2 of 6 on Duty Free Screen
            agreedRateKWD: 15000,
            productionIncluded: false,
          },
          {
            assetId: createdAssets['T5-LB-CLM'].id,
            startDate: new Date('2026-05-15'),
            endDate: new Date('2026-08-15'),
            slotIndex: 1,
            agreedRateKWD: 28000,
            productionIncluded: true,
          },
        ],
      },
    },
  });

  // Deal 6: CONCEPT_PITCH - Mindshare / Gulf Tourism Board (Full Fuselage Wrap Pitch)
  const deal6 = await prisma.deal.create({
    data: {
      dealCode: 'JZ-2026-006',
      title: 'Mindshare - Visit Red Sea Airbus A320 Full Fuselage Wrap Pitch',
      companyId: mindshare.id,
      contactId: mindshare.contacts[0].id,
      stage: 'CONCEPT_PITCH',
      totalValueKWD: 120000,
      targetStartDate: new Date('2026-09-01'),
      targetEndDate: new Date('2027-02-28'),
      aviationApproval: false,
      notes: 'High-value 6-month Airbus A320 exterior livery takeover. Includes full production & maintenance.',
      bookingSlots: {
        create: [
          {
            assetId: createdAssets['AC-WRAP-01'].id,
            startDate: new Date('2026-09-01'),
            endDate: new Date('2027-02-28'),
            slotIndex: 1,
            agreedRateKWD: 120000,
            productionIncluded: true,
          },
        ],
      },
    },
  });

  // Deal 7: RFP_RECEIVED - Auto Dealership Parking Rooftop Mega Screen
  const deal7 = await prisma.deal.create({
    data: {
      dealCode: 'JZ-2026-007',
      title: 'Al-Sayer Toyota - Parking Roof Mega Screen & Under Bridge Loop',
      companyId: impactBbdo.id,
      contactId: impactBbdo.contacts[1].id,
      stage: 'RFP_RECEIVED',
      totalValueKWD: 10250,
      targetStartDate: new Date('2026-06-01'),
      targetEndDate: new Date('2026-06-30'),
      aviationApproval: false,
      notes: 'Initial RFP for 1-month high summer highway digital exposure.',
      bookingSlots: {
        create: [
          {
            assetId: createdAssets['T5-DS-PRK'].id,
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-06-30'),
            slotIndex: 1,
            agreedRateKWD: 5750,
            productionIncluded: false,
          },
          {
            assetId: createdAssets['T5-DS-UBR'].id,
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-06-30'),
            slotIndex: 1,
            agreedRateKWD: 4500,
            productionIncluded: false,
          },
        ],
      },
    },
  });

  // Deal 8: INSTALLED_POP_DELIVERED - E-Ticket & In-flight Magazine Q1 Delivery
  const deal8 = await prisma.deal.create({
    data: {
      dealCode: 'JZ-2026-008',
      title: 'NBK "Platinum Miles" Inflight Magazine Back Cover & E-Ticket Banners',
      companyId: nbk.id,
      contactId: nbk.contacts[1].id,
      stage: 'INSTALLED_POP_DELIVERED',
      totalValueKWD: 8600,
      targetStartDate: new Date('2026-03-01'),
      targetEndDate: new Date('2026-04-30'),
      aviationApproval: true,
      flammabilityCertified: true,
      scannerChecked: true,
      dgcaPermitNo: 'DGCA-MED-2026-019',
      aviationSafetyNotes: 'Paper weight and digital web specs verified.',
      notes: 'Proof of performance distributed to client.',
      bookingSlots: {
        create: [
          {
            assetId: createdAssets['MAG-FPC-01'].id,
            startDate: new Date('2026-03-01'),
            endDate: new Date('2026-04-30'),
            slotIndex: 1,
            agreedRateKWD: 4100,
            productionIncluded: true,
          },
          {
            assetId: createdAssets['ET-CONF-01'].id,
            startDate: new Date('2026-03-01'),
            endDate: new Date('2026-04-30'),
            slotIndex: 1,
            agreedRateKWD: 4500,
            productionIncluded: false,
          },
        ],
      },
      proofOfPerformances: {
        create: [
          {
            assetId: createdAssets['MAG-FPC-01'].id,
            flightNumberOrLocation: 'Fleet-wide A320 Seat Pockets (March/April 2026 Issue)',
            timestamp: new Date('2026-03-05T10:00:00Z'),
            photoUrls: JSON.stringify([
              'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
            ]),
            certifiedBy: 'Laila Al-Faraj (Add Effect Brand Ops Lead)',
            inspectorRole: 'In-Flight Publications Inspector',
            complianceStatus: 'VERIFIED',
            inspectionNotes: 'Verified aboard flight J9 253 to Dubai and J9 111 to Riyadh. All magazine copies in pristine condition.',
          },
        ],
      },
    },
  });

  console.log(`✅ Seeded 8 multi-stage deals, booking slots, and PoP records.`);
  console.log('🎉 Jazeera Airways T5 & In-Flight CRM Database successfully initialized and seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
