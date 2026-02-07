export const dynamic = "force-dynamic"; // これを追加
import CalorieScanner from '@/app/calorie/CalorieScanner';

export default function CalorieScannerPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <CalorieScanner />
    </main>
  );
}