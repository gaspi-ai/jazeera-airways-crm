import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await prisma.inventoryAsset.findUnique({
      where: { id },
      include: {
        bookingSlots: {
          include: { deal: true },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error fetching inventory asset:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch asset', details }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.baseRate1M !== undefined)
      updateData.baseRate1M = body.baseRate1M !== null ? Number(body.baseRate1M) : null;
    if (body.baseRate3M !== undefined)
      updateData.baseRate3M = body.baseRate3M !== null ? Number(body.baseRate3M) : null;
    if (body.baseRate6M !== undefined)
      updateData.baseRate6M = body.baseRate6M !== null ? Number(body.baseRate6M) : null;
    if (body.baseRate12M !== undefined)
      updateData.baseRate12M = body.baseRate12M !== null ? Number(body.baseRate12M) : null;
    if (body.productionLeadWeeks !== undefined)
      updateData.productionLeadWeeks = Number(body.productionLeadWeeks);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions;
    if (body.technicalSpecs !== undefined) updateData.technicalSpecs = body.technicalSpecs;
    if (body.safetyComplianceReq !== undefined)
      updateData.safetyComplianceReq = body.safetyComplianceReq;

    const updated = await prisma.inventoryAsset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating inventory asset:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to update asset', details }, { status: 500 });
  }
}
