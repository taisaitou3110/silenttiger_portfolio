// lib/error.ts
import { NextResponse } from "next/server";
import { ERROR_MESSAGES, ErrorCode } from "@/constants/errorMsgs";

/**
 * アプリケーション全体で共通して使用するカスタムエラークラス
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number = 400,
    public originalError?: any
  ) {
    super(code);
    this.name = "AppError";
    
    // V8エンジン(Chrome/Node.js)でスタックトレースを保持するための処理
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * サーバーサイド(API Route)の catch ブロックで呼び出す共通ハンドラ
 * エラーを解析し、適切な JSON レスポンス (NextResponse) を返します
 */
export function handleApiError(error: any) {
  // 1. サーバー側のログには詳細なエラー内容を出力（デバッグ用）
  console.error("--- API Error Log ---");
  console.error("Code:", error instanceof AppError ? error.code : "UNKNOWN_ERROR");
  console.error("Message:", error.message);
  if (error.originalError) console.error("Original Error:", error.originalError);
  console.error("---------------------");

  // 2. 意図的に投げられた AppError の場合
  if (error instanceof AppError) {
    return NextResponse.json(
      { code: error.code },
      { status: error.statusCode }
    );
  }

  // 3. Prisma のエラーや予期せぬエラーの場合
  // 必要に応じて Prisma のエラーコード（P2002など）をここで判定して AppError に変換も可能です
  return NextResponse.json(
    { code: "INFRA_DATABASE_ERROR" },
    { status: 500 }
  );
}