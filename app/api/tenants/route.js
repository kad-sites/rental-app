import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const isActive = searchParams.get('isActive') !== 'false'

  const tenants = await prisma.tenant.findMany({
    where: { isActive, isDeleted: false },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(tenants)
}

export async function POST(request) {
  try {
    const data = await request.json()
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        phone: data.phone,
        houseNo: data.houseNo || null,
        unitNo: data.unitNo || null,
        deposit: parseFloat(data.deposit),
        rentAmount: parseFloat(data.rentAmount),
        aadharUrl: data.aadharUrl || null,
        passportUrl: data.passportUrl || null,
        photoUrl: data.photoUrl || null,
        agreementUrl: data.agreementUrl || null,
        roommate1Name: data.roommate1Name || null,
        roommate1Phone: data.roommate1Phone || null,
        roommate1AadharUrl: data.roommate1AadharUrl || null,
        roommate1PassportUrl: data.roommate1PassportUrl || null,
        roommate1PhotoUrl: data.roommate1PhotoUrl || null,
        roommate2Name: data.roommate2Name || null,
        roommate2Phone: data.roommate2Phone || null,
        roommate2AadharUrl: data.roommate2AadharUrl || null,
        roommate2PassportUrl: data.roommate2PassportUrl || null,
        roommate2PhotoUrl: data.roommate2PhotoUrl || null
      },
    })
    return NextResponse.json(tenant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (updateData.deposit !== undefined) updateData.deposit = parseFloat(updateData.deposit);
    if (updateData.rentAmount !== undefined) updateData.rentAmount = parseFloat(updateData.rentAmount);

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Failed to update tenant:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}
