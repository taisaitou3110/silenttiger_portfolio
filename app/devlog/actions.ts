"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs/promises";

// 添付ファイルの保存先ディレクトリ
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "devlog");

export async function createDevelopmentLog(formData: FormData) {
  const date = formData.get("date") as string;
  const title = formData.get("title") as string;
  const progress = formData.get("progress") as string;
  const issues = formData.get("issues") as string;
  const attachmentFile = formData.get("attachment") as File;

  let attachmentPath: string | undefined = undefined;

  // ファイルがアップロードされた場合
  if (attachmentFile && attachmentFile.size > 0) {
    // UPLOAD_DIR が存在しない場合は作成
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // ファイル名とパスを生成
    const uniqueFileName = `${Date.now()}-${attachmentFile.name}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);
    attachmentPath = path.join("/uploads/devlog", uniqueFileName); // public フォルダからのパス

    // ファイルを保存
    const buffer = Buffer.from(await attachmentFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);
  }

  await prisma.developmentLog.create({
    data: {
      date: new Date(date),
      title: title.slice(0, 30), // 念のため文字数制限
      progress: progress.slice(0, 100), // 念のため文字数制限
      issues: issues.slice(0, 400), // 念のため文字数制限
      attachment: attachmentPath,
    },
  });

  revalidatePath("/devlog");
}

// 日記一覧を取得する関数 (Server Componentで直接呼び出す用)
export async function getDevelopmentLogs() {
  const logs = await prisma.developmentLog.findMany({
    orderBy: { date: "asc" }, // 古い順
  });
  return logs;
}
