import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        contacts: true,
        deals: {
          select: {
            id: true,
            dealCode: true,
            title: true,
            stage: true,
            totalValueKWD: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type = 'DIRECT_CLIENT', industry = 'OTHER', contactEmail, phone, billingAddress, contacts = [] } = body;

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
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}
