import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const assets = await prisma.inventoryAsset.findMany({
      include: {
        bookingSlots: {
          select: {
            id: true,
            dealId: true,
            startDate: true,
            endDate: true,
            slotIndex: true,
            deal: {
              select: {
                id: true,
                dealCode: true,
                title: true,
                stage: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        },
      },
      orderBy: [
        { environment: 'asc' },
        { category: 'asc' },
        { code: 'asc' },
      ],
    });

    const enrichedAssets = assets.map((asset) => {
      // Calculate active bookings (deals that are not CLOSED_LOST)
      const activeBookings = asset.bookingSlots.filter(
        (b) => b.deal && b.deal.stage !== 'CLOSED_LOST'
      );

      // Digital screens: occupied slots count
      const occupiedSlots = asset.isDigitalLoop
        ? activeBookings.length
        : activeBookings.length > 0 ? 1 : 0;

      const availableSlots = asset.isDigitalLoop
        ? Math.max(0, asset.loopMaxClients - occupiedSlots)
        : activeBookings.length > 0 ? 0 : 1;

      // Fleet or unit allocation
      const totalUnits = asset.totalUnits;
      const bookedUnits = Math.min(totalUnits, activeBookings.length);

      return {
        ...asset,
        activeBookingsCount: activeBookings.length,
        occupiedSlots,
        availableSlots,
        bookedUnits,
        occupancyPercentage: asset.isDigitalLoop
          ? Math.round((occupiedSlots / asset.loopMaxClients) * 100)
          : activeBookings.length > 0 ? 100 : 0,
      };
    });

    return NextResponse.json(enrichedAssets, {
      headers: {
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch inventory', details }, { status: 500 });
  }
}
