import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const search = searchParams.get('search')?.toLowerCase();
    const type = searchParams.get('type');
    const industry = searchParams.get('industry');

    const whereClause: any = {};
    if (!includeArchived) {
      whereClause.isArchived = false;
    }
    if (type) {
      whereClause.type = type;
    }
    if (industry) {
      whereClause.industry = industry;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);
    const skip = Number(searchParams.get('skip')) || 0;

    const companies = await prisma.company.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      select: {
        id: true,
        name: true,
        type: true,
        industry: true,
        contactEmail: true,
        phone: true,
        billingAddress: true,
        isArchived: true,
        createdAt: true,
        contacts: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
            phone: true,
          },
        },
        deals: {
          select: {
            id: true,
            dealCode: true,
            title: true,
            stage: true,
            totalValueKWD: true,
            grossValueKWD: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(companies, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch companies', details }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      type = 'DIRECT_CLIENT',
      industry = 'OTHER',
      contactEmail,
      phone,
      billingAddress,
      contacts = [],
    } = body;

    if (!name || !contactEmail) {
      return NextResponse.json({ error: 'Name and Contact Email are required' }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        type,
        industry,
        contactEmail,
        phone: phone || null,
        billingAddress: billingAddress || null,
        contacts: {
          create: contacts.map((c: { name: string; role?: string; email: string; phone?: string }) => ({
            name: c.name,
            role: c.role || 'Media Planner',
            email: c.email || contactEmail,
            phone: c.phone || null,
          })),
        },
      },
      include: {
        contacts: true,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create company', details }, { status: 500 });
  }
}
