import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "aarhus-3d-print",
    timestamp: new Date().toISOString()
  });
}
