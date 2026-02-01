"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

// 日記一覧を取得する関数
export async function getDevelopmentLogs(page: number = 1, pageSize: number = 5) {
  const logs = await prisma.developmentLog.findMany({
    orderBy: { date: "desc" }, // 新しい順
    take: pageSize,
    skip: (page - 1) * pageSize,
  });
  const totalLogs = await prisma.developmentLog.count();
  return { logs, totalLogs };
}

// IDで日記を一件取得する関数
export async function getDevelopmentLogById(id: number) {
  const log = await prisma.developmentLog.findUnique({
    where: { id },
  });
  return log;
}

// 日記を更新する関数
export async function updateDevelopmentLog(formData: FormData) {
  const id = Number(formData.get("id"));
  const date = formData.get("date") as string;
  const title = formData.get("title") as string;
  const progress = formData.get("progress") as string;
  const issues = formData.get("issues") as string;
  const attachmentFile = formData.get("attachment") as File;
  const existingAttachment = formData.get("existingAttachment") as string;

  let attachmentPath: string | undefined = existingAttachment || undefined;

  // 新しいファイルがアップロードされた場合
  if (attachmentFile && attachmentFile.size > 0) {
    // TODO: 古い添付ファイルがあれば削除する処理を追加
    
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const uniqueFileName = `${Date.now()}-${attachmentFile.name}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);
    attachmentPath = path.join("/uploads/devlog", uniqueFileName);

    const buffer = Buffer.from(await attachmentFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);
  }

  await prisma.developmentLog.update({
    where: { id },
    data: {
      date: new Date(date),
      title: title.slice(0, 30),
      progress: progress.slice(0, 100),
      issues: issues.slice(0, 400),
      attachment: attachmentPath,
    },
  });

  revalidatePath("/devlog");
  revalidatePath(`/devlog/edit/${id}`);
  redirect("/devlog");
}
