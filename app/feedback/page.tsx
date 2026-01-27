import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import versionData from '@/app/version.json'; // Import version data

export default async function FeedbackPage() {
  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 投稿アクション
  async function createFeedback(formData: FormData) {
    "use server";
    const name = formData.get("name") as string || "匿名";
    const category = formData.get("category") as string;
    const content = formData.get("content") as string;

    await prisma.feedback.create({
      data: { name, category, content: content.slice(0, 100) },
    });
    revalidatePath("/feedback");
  }

  // 返信・削除アクション（簡易版）
  async function adminAction(formData: FormData) {
    "use server";
    const pass = formData.get("password");
    const id = Number(formData.get("id"));
    const reply = formData.get("reply") as string;
    const actionType = formData.get("actionType");

    if (pass !== "1234") return; // パスワードガード

    if (actionType === "delete") {
      await prisma.feedback.delete({ where: { id } });
    } else {
      await prisma.feedback.update({
        where: { id },
        data: { reply },
      });
    }
    revalidatePath("/feedback");
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">フィードバック掲示板 <span className="text-sm font-normal text-gray-500 ml-2">v{versionData.apps.feedback}</span></h1>
      <Link href="/" className="text-blue-500 hover:underline">トップページへ戻る</Link>

      {/* 投稿フォーム */}
      <form action={createFeedback} className="bg-gray-100 p-4 rounded shadow-sm space-y-2">
        <div className="flex gap-2">
          <input name="name" placeholder="名前（任意）" className="border p-2 rounded w-1/3" />
          <select name="category" className="border p-2 rounded w-2/3">
            {["全般", "ポーカー", "単語帳", "カロリー", "会計"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <textarea name="content" maxLength={100} required placeholder="フィードバックをどうぞ（100字以内）" className="border p-2 rounded w-full" />
        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full">送信する</button>
      </form>

      {/* フィードバック一覧 */}
      <div className="space-y-4">
        {feedbacks.map((f) => (
          <div key={f.id} className="border-b pb-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>#{f.id} [{f.category}] <strong>{f.name}</strong></span>
              <span>{f.createdAt.toLocaleString()}</span>
            </div>
            <p className="mt-2 text-lg">{f.content}</p>
            
            {/* 返信表示 */}
            {f.reply && (
              <div className="ml-6 mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                <p className="text-sm font-bold text-gray-700">管理者からの返信:</p>
                <p>{f.reply}</p>
              </div>
            )}

            {/* 管理者操作パネル（あなただけが使う） */}
            <details className="mt-2 text-xs text-gray-400">
              <summary>管理者メニュー</summary>
              <form action={adminAction} className="flex gap-2 mt-1">
                <input name="password" type="password" placeholder="Pass" className="border w-16" />
                <input name="reply" placeholder="返信内容" className="border flex-1" />
                <input type="hidden" name="id" value={f.id} />
                <button name="actionType" value="reply" className="bg-green-500 text-white px-2">返信</button>
                <button name="actionType" value="delete" className="bg-red-500 text-white px-2">削除</button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}