import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PIPELINE_STAGES } from '@/lib/types';

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        bookingSlots: {
          include: { asset: true },
        },
      },
    });

    const assets = await prisma.inventoryAsset.findMany({
      include: {
        bookingSlots: {
          include: { deal: true },
        },
      },
    });

    // 1. Pipeline Financials
    let totalPipelineValueKWD = 0;
    let weightedRevenueKWD = 0;
    let closedWonKWD = 0;
    let inProductionKWD = 0;

    const stageMap: Record<string, { count: number; value: number }> = {};
    for (const stage of PIPELINE_STAGES) {
      stageMap[stage.id] = { count: 0, value: 0 };
    }

    for (const deal of deals) {
      const stageConfig = PIPELINE_STAGES.find((s) => s.id === deal.stage);
      const weight = stageConfig ? stageConfig.weight : 0;
      const val = deal.totalValueKWD || 0;

      if (stageMap[deal.stage]) {
        stageMap[deal.stage].count += 1;
        stageMap[deal.stage].value += val;
      }

      if (deal.stage !== 'CLOSED_LOST') {
        totalPipelineValueKWD += val;
        weightedRevenueKWD += val * weight;
      }

      if (deal.stage === 'CLOSED_WON') {
        closedWonKWD += val;
      }

      if (deal.stage === 'IN_PRODUCTION') {
        inProductionKWD += val;
      }
    }

    // 2. Inventory Avails & Occupancy
    const digitalScreens = assets.filter((a) => a.isDigitalLoop);
    let totalDigitalSlots = 0;
    let occupiedDigitalSlots = 0;

    for (const screen of digitalScreens) {
      totalDigitalSlots += screen.loopMaxClients;
      const activeBookings = screen.bookingSlots.filter(
        (b) => b.deal && b.deal.stage !== 'CLOSED_LOST'
      );
      occupiedDigitalSlots += activeBookings.length;
    }

    const digitalOccupancyRate =
      totalDigitalSlots > 0 ? Math.round((occupiedDigitalSlots / totalDigitalSlots) * 100) : 0;

    // 3. Aircraft fleet allocations
    const fleetAssets = assets.filter((a) => a.environment === 'INFLIGHT' && a.totalUnits === 24);
    let activeFleetWrapOrCabinDeals = 0;
    for (const fleetAsset of fleetAssets) {
      const active = fleetAsset.bookingSlots.filter(
        (b) => b.deal && ['IO_SIGNED', 'IN_PRODUCTION', 'INSTALLED_POP_DELIVERED', 'CLOSED_WON'].includes(b.deal.stage)
      );
      activeFleetWrapOrCabinDeals += active.length;
    }

    const pendingAviationApprovalCount = deals.filter(
      (d) => !d.aviationApproval && !['CLOSED_LOST', 'CLOSED_WON'].includes(d.stage)
    ).length;

    return NextResponse.json({
      totalPipelineValueKWD,
      weightedRevenueKWD: Math.round(weightedRevenueKWD),
      closedWonKWD,
      inProductionKWD,
      totalDealsCount: deals.length,
      pendingAviationApprovalCount,
      digitalOccupancyRate,
      occupiedDigitalSlots,
      totalDigitalSlots,
      activeFleetAllocations: activeFleetWrapOrCabinDeals,
      stageMap,
      pitchDeckStats: {
        annualPassengers: '4.9M+',
        marketShareKuwait: '30.5%',
        a320FleetSize: 24,
        destinationsCount: '60+',
        baggageCapacityPerHour: '1,200 bags/hr',
        avgDwellTimeMinutes: '15 min (T5 check-in to gate)',
        t5DailyFootfall: '14,000+ passengers/day',
      },
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to calculate stats', details }, { status: 500 });
  }
}
