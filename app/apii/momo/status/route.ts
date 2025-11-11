import { NextRequest, NextResponse } from "next/server";
import { getTransactionStatus } from "@/lib/momo";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const referenceId = searchParams.get("ref");

    if (!referenceId) {
      return NextResponse.json(
        { error: "Reference ID is required" },
        { status: 400 }
      );
    }

    const status = await getTransactionStatus(referenceId);

    return NextResponse.json(status);
  } catch (error: any) {
    console.error("Error checking status:", error);
    return NextResponse.json(
      { 
        status: "PENDING",
        error: error.message 
      },
      { status: 200 }
    );
  }
}