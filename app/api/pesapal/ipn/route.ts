import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const orderMerchantReference = searchParams.get('OrderMerchantReference');

  console.log('📨 Pesapal IPN notification received:', {
    orderTrackingId,
    orderMerchantReference,
  });

  return NextResponse.json({ status: 'success' });
}