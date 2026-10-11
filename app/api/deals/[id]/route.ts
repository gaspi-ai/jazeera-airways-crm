import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 });
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
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.totalValueKWD !== undefined) updateData.totalValueKWD = Number(body.totalValueKWD);

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
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
