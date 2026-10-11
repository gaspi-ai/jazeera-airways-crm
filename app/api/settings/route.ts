import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_SETTINGS = {
  agencyCommissionPreset: 15,
  defaultDiscountPresets: [5, 10, 15, 20],
  currency: 'KWD',
  entityName: 'Jazeera Airways K.S.C.P.',
  department: 'Commercial Media & In-Flight Sales Directorate',
  taxRegistration: 'KW-DGCA-MED-041',
  minProductionLeadWeeks: 4,
  flammabilityStandard: 'FAA FAR 25.853 / EASA CS-25 (12-second vertical flammability)',
  scannerStandard: 'IATA 722e Optical Reflection Compliance',
  dgcaPermitRequired: true,
};

export async function GET() {
  try {
    const settingsList = await prisma.systemSetting.findMany();
    const result: Record<string, any> = { ...DEFAULT_SETTINGS };

    for (const item of settingsList) {
      try {
        result[item.key] = JSON.parse(item.value);
      } catch {
        result[item.key] = item.value;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch settings', details }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    for (const [key, val] of Object.entries(body)) {
      const stringValue = typeof val === 'object' ? JSON.stringify(val) : String(val);
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      });
    }

    // Return the updated settings map
    const settingsList = await prisma.systemSetting.findMany();
    const result: Record<string, any> = { ...DEFAULT_SETTINGS };

    for (const item of settingsList) {
      try {
        result[item.key] = JSON.parse(item.value);
      } catch {
        result[item.key] = item.value;
      }
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (error) {
    console.error('Error saving settings:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to save settings', details }, { status: 500 });
  }
}
