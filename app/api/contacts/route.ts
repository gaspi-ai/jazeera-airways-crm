import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, role = 'Media Planner', email, phone } = body;

    if (!companyId || !name || !email) {
      return NextResponse.json(
        { error: 'Company ID, contact name, and email are required' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        companyId,
        name,
        role,
        email,
        phone: phone || null,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create contact', details }, { status: 500 });
  }
}
