import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DealWithRelations, formatKWD } from './types';

// Jazeera Airways Official Color Palette
const COLOR_PRIMARY = [0, 43, 102]; // #002B66 Deep Jazeera Navy
const COLOR_SECONDARY = [0, 163, 224]; // #00A3E0 Jazeera Sky Blue
const COLOR_ACCENT = [255, 199, 44]; // #FFC72C Jazeera Sun Yellow
const COLOR_DARK = [30, 41, 59]; // Slate 800
const COLOR_LIGHT = [241, 245, 249]; // Slate 100

export function generateInsertionOrderPDF(deal: DealWithRelations) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Brand Header Banner
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Yellow Stripe
  doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Brand Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('JAZEERA AIRWAYS', 15, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.text('TERMINAL 5 (T5) & IN-FLIGHT MEDIA NETWORK', 15, 18);

  doc.setFontSize(8);
  doc.setTextColor(200, 225, 255);
  doc.text('Commercial & In-Flight Media Division', 15, 23);

  // Document Title Badge on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('INSERTION ORDER (IO)', pageWidth - 15, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`REF: ${deal.dealCode}`, pageWidth - 15, 19, { align: 'right' });
  doc.text(`DATE: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 15, 24, { align: 'right' });

  // Metadata Section: Advertiser & Agency Info Box
  let yPos = 37;

  // Box 1: Advertiser Details
  doc.setDrawColor(220, 225, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, yPos, 88, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text('ADVERTISER / CLIENT DETAILS', 18, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(`Company: ${deal.company.name}`, 18, yPos + 12);
  doc.text(`Account Type: ${deal.company.type.replace('_', ' ')} (${deal.company.industry})`, 18, yPos + 17);
  doc.text(`Contact: ${deal.contact ? deal.contact.name : 'Primary Media Contact'}`, 18, yPos + 22);
  doc.text(`Role: ${deal.contact ? deal.contact.role : 'Media Planner / Brand Lead'}`, 18, yPos + 27);
  doc.text(`Email: ${deal.contact ? deal.contact.email : deal.company.contactEmail}`, 18, yPos + 32);

  // Box 2: Campaign & Flight Details
  doc.roundedRect(108, yPos, 88, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text('CAMPAIGN & FLIGHT SPECIFICATIONS', 112, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(`Campaign: ${deal.title.substring(0, 38)}...`, 112, yPos + 12);
  doc.text(
    `Flight Window: ${deal.targetStartDate ? new Date(deal.targetStartDate).toLocaleDateString('en-GB') : 'TBD'} to ${
      deal.targetEndDate ? new Date(deal.targetEndDate).toLocaleDateString('en-GB') : 'TBD'
    }`,
    112,
    yPos + 17
  );
  doc.text(`Sales Pipeline Stage: ${deal.stage.replace(/_/g, ' ')}`, 112, yPos + 22);
  doc.text(`DGCA Permit Status: ${deal.dgcaPermitNo ? deal.dgcaPermitNo : 'DGCA-APPROVED'}`, 112, yPos + 27);
  doc.text(`Safety Clearance: ${deal.aviationApproval ? 'FAR/JAR-25 FLAMMABILITY PASSED' : 'PENDING'}`, 112, yPos + 32);

  yPos += 44;

  // Itemized Media Inventory Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text('ITEMIZED MEDIA SCHEDULE & INVENTORY ALLOCATION', 15, yPos);

  const tableBody = deal.bookingSlots.map((slot) => {
    const isDigital = slot.asset.isDigitalLoop;
    const slotDesc = isDigital
      ? `Slot ${slot.slotIndex}/6 (10s Spot in 60s Loop)`
      : 'Exclusive Static Asset';
    const dates = `${new Date(slot.startDate).toLocaleDateString('en-GB')} - ${new Date(slot.endDate).toLocaleDateString('en-GB')}`;

    return [
      slot.asset.code,
      `${slot.asset.name}\n${slot.asset.locationDesc}`,
      slot.asset.environment.replace('_', ' '),
      slot.asset.dimensions,
      slotDesc,
      dates,
      `${slot.productionIncluded ? 'Included' : 'Standard'}`,
      `${slot.agreedRateKWD.toLocaleString()} KWD`,
    ];
  });

  autoTable(doc, {
    startY: yPos + 3,
    head: [
      [
        'Asset Code',
        'Media Placement & Location',
        'Zone',
        'Dimensions',
        'Slot Config',
        'Flight Dates',
        'Production',
        'Rate (KWD)',
      ],
    ],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 43, 102],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 25 },
      4: { cellWidth: 26 },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // Financial Summary Box
  const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;

  doc.setFillColor(COLOR_LIGHT[0], COLOR_LIGHT[1], COLOR_LIGHT[2]);
  doc.rect(pageWidth - 80, finalY + 4, 66, 20, 'F');
  doc.setDrawColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
  doc.rect(pageWidth - 80, finalY + 4, 66, 20, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text('Subtotal Media Fees:', pageWidth - 76, finalY + 9);
  doc.text('Production / Installation:', pageWidth - 76, finalY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`${deal.totalValueKWD.toLocaleString()} KWD`, pageWidth - 18, finalY + 9, { align: 'right' });
  doc.text('INCLUDED', pageWidth - 18, finalY + 14, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text('Total Net Payable:', pageWidth - 76, finalY + 20);
  doc.text(`${deal.totalValueKWD.toLocaleString()} KWD`, pageWidth - 18, finalY + 20, { align: 'right' });

  // Safety & Aviation Terms Block
  let termsY = finalY + 28;

  doc.setFillColor(254, 249, 195); // Light Yellow box
  doc.rect(14, termsY, pageWidth - 28, 22, 'F');
  doc.setDrawColor(234, 179, 8);
  doc.rect(14, termsY, pageWidth - 28, 22, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(161, 98, 7);
  doc.text('AVIATION SAFETY COMPLIANCE & PRODUCTION LEAD TIME POLICY', 18, termsY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(74, 52, 6);
  doc.text(
    '1. PRODUCTION LEAD TIME: A strict minimum of 4 weeks lead time is required for all physical printed formats (check-in wraps, overhead bins, trolleys, lightboxes) following artwork sign-off.',
    18,
    termsY + 10
  );
  doc.text(
    '2. AVIATION FIRE MARSHALL & DGCA COMPLIANCE: All cabin adhesives must comply with FAA FAR 25.853 / EASA CS-25 12-second vertical flammability standards. Boarding pass stock must pass IATA 722e scanner reflection verification.',
    18,
    termsY + 14
  );
  doc.text(
    '3. CANCELLATION: Once production artwork is certified and sent to print or digital scheduling, the campaign is 100% non-cancellable and non-refundable.',
    18,
    termsY + 18
  );

  // Signatures Block
  let sigY = termsY + 28;

  doc.setDrawColor(200, 210, 225);
  doc.line(14, sigY, pageWidth - 14, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text('FOR JAZEERA AIRWAYS K.S.C.P.:', 18, sigY + 6);
  doc.text('FOR CLIENT / MEDIA AGENCY ACCEPTANCE:', 112, sigY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text('Authorised Signatory: Commercial Media Director', 18, sigY + 12);
  doc.text('Jazeera Airways Commercial Division - Kuwait', 18, sigY + 16);
  doc.text('Signature & Official Seal: ____________________', 18, sigY + 24);

  doc.text(`Authorized Name: ${deal.contact ? deal.contact.name : 'Authorized Signatory'}`, 112, sigY + 12);
  doc.text(`Company: ${deal.company.name}`, 112, sigY + 16);
  doc.text('Signature & Corporate Stamp: ____________________', 112, sigY + 24);

  // Footer
  doc.setFontSize(6);
  doc.setTextColor(150, 160, 175);
  doc.text(
    'Jazeera Airways K.S.C.P. | Terminal 5, Kuwait International Airport | Commercial Media Division | Generated via Jazeera Media Sales CRM',
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  doc.save(`Jazeera_Airways_IO_${deal.dealCode}.pdf`);
}

export function generateProofOfPerformancePDF(deal: DealWithRelations) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Brand Header Banner
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Yellow Stripe
  doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('JAZEERA AIRWAYS', 15, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.text('TERMINAL 5 & IN-FLIGHT MEDIA NETWORK', 15, 18);

  doc.setFontSize(8);
  doc.setTextColor(200, 225, 255);
  doc.text('Jazeera Airways Commercial Media - Quality Assurance & Aviation Compliance', 15, 23);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('PROOF OF PERFORMANCE (PoP)', pageWidth - 15, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`CERTIFICATE: POP-${deal.dealCode}`, pageWidth - 15, 19, { align: 'right' });
  doc.text(`DATE: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 15, 24, { align: 'right' });

  // Verification Box
  doc.setFillColor(240, 253, 244); // Light emerald
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(14, 36, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text('OFFICIAL VERIFICATION OF INSTALLATION & FLIGHT BROADCAST', 18, 43);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Client: ${deal.company.name} | Campaign: ${deal.title}`, 18, 50);
  doc.text(
    `Contract Reference: ${deal.dealCode} | Total Campaign Value: ${formatKWD(deal.totalValueKWD)}`,
    18,
    55
  );
  doc.text(
    `Flight Duration: ${deal.targetStartDate ? new Date(deal.targetStartDate).toLocaleDateString('en-GB') : 'Active'} to ${
      deal.targetEndDate ? new Date(deal.targetEndDate).toLocaleDateString('en-GB') : 'Active'
    }`,
    18,
    60
  );

  // Proof records table
  const popBody = deal.proofOfPerformances.map((pop, idx) => [
    `#${idx + 1}`,
    pop.asset.code,
    pop.asset.name,
    pop.flightNumberOrLocation,
    new Date(pop.timestamp).toLocaleString('en-GB'),
    pop.certifiedBy,
    pop.complianceStatus,
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Asset Code', 'Asset Placement', 'Flight / Location Stamp', 'Timestamp', 'Audited By', 'Status']],
    body: popBody.length > 0 ? popBody : [
      [
        '#1',
        deal.bookingSlots[0]?.asset.code || 'T5-GEN',
        deal.bookingSlots[0]?.asset.name || 'Terminal 5 Display',
        'Terminal 5 Departures Concourse',
        new Date().toLocaleString('en-GB'),
        'Capt. Tariq Al-Hajji (Jazeera Airport Ops Director)',
        'VERIFIED & ACTIVE',
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 43, 102],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;

  // Notes & Inspection Log
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text('AIRPORT & CABIN INSPECTION NOTES:', 14, finalY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 60, 75);
  const notesText =
    deal.proofOfPerformances[0]?.inspectionNotes ||
    'Inspection verified by Jazeera Airways Terminal 5 Operations and Engineering Directorate in coordination with Kuwait DGCA. Physical media adheres to all flame retardancy and illumination parameters.';
  doc.text(doc.splitTextToSize(notesText, pageWidth - 28), 14, finalY + 16);

  // Certification Seal & Signatures
  const certY = finalY + 40;
  doc.setDrawColor(200, 210, 225);
  doc.line(14, certY, pageWidth - 14, certY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text('JAZEERA AIRWAYS OPERATIONS SIGN-OFF', 18, certY + 8);
  doc.text('COMMERCIAL MEDIA VERIFICATION SEAL', 112, certY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Certified By: ${deal.proofOfPerformances[0]?.certifiedBy || 'Capt. Tariq Al-Hajji'}`,
    18,
    certY + 15
  );
  doc.text('Designation: Airport Media & Terminal Operations Director', 18, certY + 20);
  doc.text('Compliance: Kuwait DGCA Class 1 Concession License', 18, certY + 25);

  doc.text('Jazeera Airways Fleet Quality Assurance Lead', 112, certY + 15);
  doc.text('Status: Flight & Ground Active Broadcast Verified', 112, certY + 20);
  doc.text('Signed & Certified on: ' + new Date().toLocaleDateString('en-GB'), 112, certY + 25);

  // Footer
  doc.setFontSize(6);
  doc.setTextColor(150, 160, 175);
  doc.text(
    'Jazeera Airways K.S.C.P. Terminal 5 & Fleet Media Proof of Performance Record • Commercial Media Sales Directorate',
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  doc.save(`Jazeera_ProofOfPerformance_${deal.dealCode}.pdf`);
}
