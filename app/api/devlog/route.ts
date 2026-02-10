import { NextResponse } from "next/server";
import { getDevelopmentLogs } from "@/app/devlog/actions"; // actions.ts からインポート
import { MESSAGE_MASTER } from "@/components/MessageMst";

export async function GET() {
  try {
    const logs = await getDevelopmentLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch development logs:", error);
    return NextResponse.json(
      { error: MESSAGE_MASTER.ERROR.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
