import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const stage = searchParams.get('stage');
    const companyType = searchParams.get('companyType');

    const whereClause: any = {};
    if (stage) {
      whereClause.stage = stage;
    }
    if (companyType) {
      whereClause.company = { type: companyType };
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { dealCode: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const deals = await prisma.deal.findMany({
      where: whereClause,
      include: {
        company: true,
        contact: true,
        bookingSlots: {
          include: {
            asset: true,
          },
        },
        proofOfPerformances: {
          include: {
            asset: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch deals', details }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      companyId,
      contactId,
      stage = 'RFP_RECEIVED',
      targetStartDate,
      targetEndDate,
      aviationApproval = false,
      flammabilityCertified = false,
      scannerChecked = false,
      dgcaPermitNo,
      aviationSafetyNotes,
      notes,
      discountType = 'NONE',
      discountValue = 0,
      bookingSlots = [],
    } = body;

    if (!title || !companyId) {
      return NextResponse.json({ error: 'Title and Company are required' }, { status: 400 });
    }

    // Safety gate check if initialized directly as IO_SIGNED
    if (stage === 'IO_SIGNED' && !aviationApproval) {
      return NextResponse.json(
        { error: 'Aviation Safety Approval (FAR/JAR-25 flammability) is required before signing IO.' },
        { status: 400 }
      );
    }

    // Process booking slots
    let grossValueKWD = 0;
    const slotsToCreate = [];

    for (const slot of bookingSlots) {
      const start = new Date(slot.startDate || targetStartDate);
      const end = new Date(slot.endDate || targetEndDate);
      const rate = Number(slot.agreedRateKWD) || 0;
      grossValueKWD += rate;

      // 1. Fetch asset details for validation
      const asset = await prisma.inventoryAsset.findUnique({
        where: { id: slot.assetId },
      });

      if (!asset) {
        return NextResponse.json({ error: `Asset ID ${slot.assetId} not found` }, { status: 404 });
      }

      // 2. Booking overlap safeguards (exclude CLOSED_LOST deals)
      if (!asset.isDigitalLoop) {
        // Static Asset Exclusive Booking Check
        const conflict = await prisma.bookingSlot.findFirst({
          where: {
            assetId: asset.id,
            deal: {
              stage: { not: 'CLOSED_LOST' },
            },
            startDate: { lte: end },
            endDate: { gte: start },
          },
          include: {
            deal: {
              include: { company: true },
            },
          },
        });

        if (conflict) {
          return NextResponse.json(
            {
              error: `Exclusive Booking Conflict: ${asset.name} (${asset.code}) is already booked from ${formatDate(conflict.startDate)} to ${formatDate(conflict.endDate)} for ${conflict.deal.company.name}.`,
              code: 'ASSET_EXCLUSIVE_CONFLICT',
            },
            { status: 409 }
          );
        }
      } else {
        // Digital Loop Screen Capacity Check
        const overlappingCount = await prisma.bookingSlot.count({
          where: {
            assetId: asset.id,
            deal: {
              stage: { not: 'CLOSED_LOST' },
            },
            startDate: { lte: end },
            endDate: { gte: start },
          },
        });

        if (overlappingCount >= asset.loopMaxClients) {
          return NextResponse.json(
            {
              error: `Digital Loop Capacity Full: ${asset.name} (${asset.code}) already has ${overlappingCount}/${asset.loopMaxClients} active advertisers during the chosen date range.`,
              code: 'DIGITAL_LOOP_FULL',
            },
            { status: 409 }
          );
        }
      }

      slotsToCreate.push({
        assetId: slot.assetId,
        startDate: start,
        endDate: end,
        slotIndex: slot.slotIndex || 1,
        agreedRateKWD: rate,
        productionIncluded: Boolean(slot.productionIncluded),
        notes: slot.notes || null,
      });
    }

    // Calculate Discount & Net Total
    let discountAmountKWD = 0;
    const numDiscountVal = Number(discountValue) || 0;

    if (discountType === 'PERCENTAGE' && numDiscountVal > 0) {
      discountAmountKWD = Math.round(grossValueKWD * (numDiscountVal / 100));
    } else if (discountType === 'FIXED_AMOUNT' && numDiscountVal > 0) {
      discountAmountKWD = Math.min(grossValueKWD, numDiscountVal);
    }

    const totalValueKWD = Math.max(0, grossValueKWD - discountAmountKWD);

    // Generate unique Deal Code
    const count = await prisma.deal.count();
    const dealCode = `JZ-2026-${String(count + 1).padStart(3, '0')}`;

    const deal = await prisma.deal.create({
      data: {
        dealCode,
        title,
        companyId,
        contactId: contactId || null,
        stage,
        grossValueKWD,
        discountType: discountType || 'NONE',
        discountValue: numDiscountVal,
        discountAmountKWD,
        totalValueKWD,
        targetStartDate: targetStartDate ? new Date(targetStartDate) : null,
        targetEndDate: targetEndDate ? new Date(targetEndDate) : null,
        aviationApproval: Boolean(aviationApproval),
        flammabilityCertified: Boolean(flammabilityCertified),
        scannerChecked: Boolean(scannerChecked),
        dgcaPermitNo: dgcaPermitNo || null,
        aviationSafetyNotes: aviationSafetyNotes || null,
        notes: notes || null,
        bookingSlots: {
          create: slotsToCreate,
        },
      },
      include: {
        company: true,
        contact: true,
        bookingSlots: {
          include: { asset: true },
        },
        proofOfPerformances: {
          include: {
            asset: { select: { code: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create deal', details }, { status: 500 });
  }
}
