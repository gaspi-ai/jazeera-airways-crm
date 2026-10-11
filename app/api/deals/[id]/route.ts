import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deal = await prisma.deal.findUnique({
      where: { id },
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
            asset: true,
          },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch deal', details }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const currentDeal = await prisma.deal.findUnique({
      where: { id },
      include: { bookingSlots: true },
    });

    if (!currentDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const nextStage = body.stage ?? currentDeal.stage;
    const nextAviationApproval =
      body.aviationApproval !== undefined ? body.aviationApproval : currentDeal.aviationApproval;

    // Safety gate check: block transitions to IO_SIGNED or beyond if aviation safety approval is not cleared
    const stagesRequiringApproval = [
      'IO_SIGNED',
      'IN_PRODUCTION',
      'INSTALLED_POP_DELIVERED',
      'CLOSED_WON',
    ];

    if (stagesRequiringApproval.includes(nextStage) && !nextAviationApproval) {
      return NextResponse.json(
        {
          error:
            'Aviation & Material Safety Approval (Adhesive flammability FAR/JAR-25 verification and T5 scanner optical test) is MANDATORY before transitioning to IO_SIGNED.',
          code: 'SAFETY_APPROVAL_REQUIRED',
        },
        { status: 422 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.companyId !== undefined) updateData.companyId = body.companyId;
    if (body.contactId !== undefined) updateData.contactId = body.contactId;
    if (body.stage !== undefined) updateData.stage = body.stage;
    if (body.targetStartDate !== undefined)
      updateData.targetStartDate = body.targetStartDate ? new Date(body.targetStartDate) : null;
    if (body.targetEndDate !== undefined)
      updateData.targetEndDate = body.targetEndDate ? new Date(body.targetEndDate) : null;
    if (body.aviationApproval !== undefined) updateData.aviationApproval = Boolean(body.aviationApproval);
    if (body.flammabilityCertified !== undefined)
      updateData.flammabilityCertified = Boolean(body.flammabilityCertified);
    if (body.scannerChecked !== undefined) updateData.scannerChecked = Boolean(body.scannerChecked);
    if (body.dgcaPermitNo !== undefined) updateData.dgcaPermitNo = body.dgcaPermitNo;
    if (body.aviationSafetyNotes !== undefined)
      updateData.aviationSafetyNotes = body.aviationSafetyNotes;
    if (body.cancellationReason !== undefined) updateData.cancellationReason = body.cancellationReason;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // If new booking slots are provided, validate overlaps and recreate
    let grossVal = currentDeal.grossValueKWD || currentDeal.totalValueKWD;

    if (body.bookingSlots && Array.isArray(body.bookingSlots)) {
      grossVal = 0;
      const validatedSlots = [];

      for (const slot of body.bookingSlots) {
        const start = new Date(slot.startDate || body.targetStartDate || currentDeal.targetStartDate);
        const end = new Date(slot.endDate || body.targetEndDate || currentDeal.targetEndDate);
        const rate = Number(slot.agreedRateKWD) || 0;
        grossVal += rate;

        const asset = await prisma.inventoryAsset.findUnique({
          where: { id: slot.assetId },
        });

        if (!asset) {
          return NextResponse.json({ error: `Asset ID ${slot.assetId} not found` }, { status: 404 });
        }

        // Overlap safeguards:
        // Hard lock applies to confirmed booked stages (excluding this deal's own slots)
        const CONFIRMED_BOOKED_STAGES = [
          'IO_SIGNED',
          'IN_PRODUCTION',
          'INSTALLED_POP_DELIVERED',
          'LIVE_RUNNING',
          'CLOSED_WON',
        ];

        if (!asset.isDigitalLoop) {
          const conflict = await prisma.bookingSlot.findFirst({
            where: {
              assetId: asset.id,
              dealId: { not: id },
              deal: {
                stage: { in: CONFIRMED_BOOKED_STAGES },
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
                error: `Exclusive Booking Conflict: ${asset.name} (${asset.code}) has a confirmed booking from ${formatDate(conflict.startDate)} to ${formatDate(conflict.endDate)} for ${conflict.deal.company.name}. Please select alternative dates or an available placement.`,
                code: 'ASSET_EXCLUSIVE_CONFLICT',
              },
              { status: 409 }
            );
          }
        } else {
          const overlappingCount = await prisma.bookingSlot.count({
            where: {
              assetId: asset.id,
              dealId: { not: id },
              deal: {
                stage: { in: CONFIRMED_BOOKED_STAGES },
              },
              startDate: { lte: end },
              endDate: { gte: start },
            },
          });

          if (overlappingCount >= asset.loopMaxClients) {
            return NextResponse.json(
              {
                error: `Digital Loop Capacity Full: ${asset.name} (${asset.code}) already has ${overlappingCount}/${asset.loopMaxClients} confirmed advertisers during the chosen date range.`,
                code: 'DIGITAL_LOOP_FULL',
              },
              { status: 409 }
            );
          }
        }

        validatedSlots.push({
          dealId: id,
          assetId: slot.assetId,
          startDate: start,
          endDate: end,
          slotIndex: slot.slotIndex || 1,
          agreedRateKWD: rate,
          productionIncluded: Boolean(slot.productionIncluded),
          notes: slot.notes || null,
        });
      }

      // Recreate booking slots in a transaction
      await prisma.bookingSlot.deleteMany({ where: { dealId: id } });
      await prisma.bookingSlot.createMany({ data: validatedSlots });
    }

    // Handle Discounts
    const discType = body.discountType !== undefined ? body.discountType : currentDeal.discountType;
    const discVal = body.discountValue !== undefined ? Number(body.discountValue) : currentDeal.discountValue;

    let discountAmountKWD = 0;
    if (discType === 'PERCENTAGE' && discVal > 0) {
      discountAmountKWD = Math.round(grossVal * (discVal / 100));
    } else if (discType === 'FIXED_AMOUNT' && discVal > 0) {
      discountAmountKWD = Math.min(grossVal, discVal);
    }

    const netValueKWD = Math.max(0, grossVal - discountAmountKWD);

    updateData.grossValueKWD = grossVal;
    updateData.discountType = discType || 'NONE';
    updateData.discountValue = discVal;
    updateData.discountAmountKWD = discountAmountKWD;
    updateData.totalValueKWD = netValueKWD;

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to update deal', details }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.deal.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to delete deal', details }, { status: 500 });
  }
}
