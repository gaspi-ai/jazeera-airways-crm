import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const pops = await prisma.proofOfPerformance.findMany({
      include: {
        deal: {
          include: {
            company: true,
          },
        },
        asset: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(pops);
  } catch (error) {
    console.error('Error fetching proof of performance:', error);
    return NextResponse.json({ error: 'Failed to fetch proof of performance' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      dealId,
      assetId,
      flightNumberOrLocation,
      photoUrls = '[]',
      certifiedBy,
      inspectorRole = 'Terminal / Fleet Compliance Officer',
      complianceStatus = 'VERIFIED',
      inspectionNotes,
    } = body;

    if (!dealId || !assetId || !flightNumberOrLocation || !certifiedBy) {
      return NextResponse.json(
        { error: 'dealId, assetId, flightNumberOrLocation, and certifiedBy are required' },
        { status: 400 }
      );
    }

    const pop = await prisma.proofOfPerformance.create({
      data: {
        dealId,
        assetId,
        flightNumberOrLocation,
        photoUrls: typeof photoUrls === 'string' ? photoUrls : JSON.stringify(photoUrls),
        certifiedBy,
        inspectorRole,
        complianceStatus,
        inspectionNotes: inspectionNotes || null,
        timestamp: new Date(),
      },
      include: {
        deal: {
          include: { company: true },
        },
        asset: true,
      },
    });

    // Optionally advance deal stage to INSTALLED_POP_DELIVERED if it's currently IN_PRODUCTION
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (deal && deal.stage === 'IN_PRODUCTION') {
      await prisma.deal.update({
        where: { id: dealId },
        data: { stage: 'INSTALLED_POP_DELIVERED' },
      });
    }

    return NextResponse.json(pop, { status: 201 });
  } catch (error) {
    console.error('Error creating proof of performance:', error);
    return NextResponse.json({ error: 'Failed to create proof of performance' }, { status: 500 });
  }
}
