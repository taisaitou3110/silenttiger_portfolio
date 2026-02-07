// app/devlog/edit/[id]/page.tsx
import { getDevelopmentLogById, updateDevelopmentLog } from "@/app/devlog/actions";
import { DevlogForm } from "@/app/devlog/DevlogForm";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditDevlogPageProps {
  params: {
    id: string;
  };
}

export default async function EditDevlogPage({ params }: EditDevlogPageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) {
    notFound();
  }

  const devlog = await getDevelopmentLogById(id);

  if (!devlog) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">開発日記 編集</h1>
        <Link href="/devlog" className="text-blue-500 hover:underline">← 日記一覧へ戻る</Link>
      </div>

      <div className="max-w-md mx-auto">
        <DevlogForm
          initialData={devlog}
          formAction={updateDevelopmentLog}
          buttonText="更新する"
        />
      </div>
    </div>
  );
}