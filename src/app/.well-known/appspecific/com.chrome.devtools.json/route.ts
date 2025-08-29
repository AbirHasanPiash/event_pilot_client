import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({}, { status: 204 }); // Empty or placeholder
}