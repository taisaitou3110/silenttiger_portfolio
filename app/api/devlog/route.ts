import { NextResponse } from "next/server";
import { getDevelopmentLogs } from "@/app/devlog/actions"; // actions.ts からインポート

export async function GET() {
  try {
    const logs = await getDevelopmentLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch development logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
