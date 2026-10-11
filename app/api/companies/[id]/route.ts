import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: true,
        deals: {
          include: {
            bookingSlots: {
              include: { asset: true },
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch company', details }, { status: 500 });
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
    if (body.type !== undefined) updateData.type = body.type;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.billingAddress !== undefined) updateData.billingAddress = body.billingAddress;
    if (body.isArchived !== undefined) updateData.isArchived = Boolean(body.isArchived);

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        contacts: true,
        deals: true,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to update company', details }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'archive' or 'hard'

    const company = await prisma.company.findUnique({
      where: { id },
      include: { deals: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const activeDeals = company.deals.filter((d) => d.stage !== 'CLOSED_LOST');

    // If archiving requested, perform soft-delete
    if (mode === 'archive') {
      const updated = await prisma.company.update({
        where: { id },
        data: { isArchived: true },
      });
      return NextResponse.json({
        success: true,
        archived: true,
        message: `${company.name} archived successfully to preserve historical deals.`,
      });
    }

    // If company has active deals and hard delete was not forced
    if (activeDeals.length > 0 && mode !== 'force') {
      return NextResponse.json(
        {
          error: `Cannot permanently delete ${company.name}: It has ${activeDeals.length} active deal(s) linked. Archive this account instead to preserve audit logs, or delete the deals first.`,
          hasActiveDeals: true,
          activeDealsCount: activeDeals.length,
        },
        { status: 409 }
      );
    }

    // Hard delete
    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `${company.name} permanently removed.`,
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to delete company', details }, { status: 500 });
  }
}
