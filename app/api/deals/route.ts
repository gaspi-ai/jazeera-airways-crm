import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
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

    // Generate unique Deal Code
    const count = await prisma.deal.count();
    const dealCode = `JZ-2026-${String(count + 1).padStart(3, '0')}`;

    // Calculate total value from booking slots
    let totalValueKWD = 0;
    const slotsToCreate = bookingSlots.map((slot: {
      assetId: string;
      startDate: string;
      endDate: string;
      slotIndex?: number;
      agreedRateKWD: number;
      productionIncluded?: boolean;
      notes?: string;
    }) => {
      totalValueKWD += Number(slot.agreedRateKWD) || 0;
      return {
        assetId: slot.assetId,
        startDate: new Date(slot.startDate),
        endDate: new Date(slot.endDate),
        slotIndex: slot.slotIndex || 1,
        agreedRateKWD: Number(slot.agreedRateKWD) || 0,
        productionIncluded: Boolean(slot.productionIncluded),
        notes: slot.notes || null,
      };
    });

    const deal = await prisma.deal.create({
      data: {
        dealCode,
        title,
        companyId,
        contactId: contactId || null,
        stage,
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
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
