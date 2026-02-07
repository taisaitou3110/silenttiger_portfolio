// app/calorie/settings/page.tsx
import prisma from '@/lib/prisma';
import { saveUserSettings, saveCustomFood, deleteCustomFood } from './actions';
import { revalidatePath } from 'next/cache';
import { ensureUserSettings } from '@/app/calorie/actions'; // Re-use ensureUserSettings

export const dynamic = "force-dynamic";

export default async function CalorieSettingsPage() {
  const userId = await ensureUserSettings(); // Ensure user settings exist
  const userSettings = await prisma.userSettings.findUnique({
    where: { id: userId },
  });
  const customFoods = await prisma.customFood.findMany({
    where: { userId: userId },
  });

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">カロリー記録アプリ - 設定</h1>

      {/* ユーザー設定フォーム */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">目標・身体情報設定</h2>
        <form action={async (formData) => {
          'use server';
          await saveUserSettings(formData);
          revalidatePath('/calorie/settings');
          revalidatePath('/calorie'); // Revalidate dashboard
        }} className="space-y-4">
          <div>
            <label htmlFor="targetCalories" className="block text-sm font-medium text-gray-700">目標カロリー (kcal)</label>
            <input
              type="number"
              id="targetCalories"
              name="targetCalories"
              defaultValue={userSettings?.targetCalories || 2000}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">体重 (kg)</label>
            <input
              type="number"
              step="0.1"
              id="weight"
              name="weight"
              defaultValue={userSettings?.weight || ''}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700">活動レベル</label>
            <select
              id="activityLevel"
              name="activityLevel"
              defaultValue={userSettings?.activityLevel || ''}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">選択してください</option>
              <option value="sedentary">座りがち (ほとんど運動しない)</option>
              <option value="light">軽度 (週1-3日軽い運動)</option>
              <option value="moderate">中度 (週3-5日中程度の運動)</option>
              <option value="active">高強度 (週6-7日激しい運動)</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline"
          >
            設定を保存
          </button>
        </form>

        {/* カスタム料理マスタ管理フォーム */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">カスタム料理マスタ</h2>
          <form action={async (formData) => {
            'use server';
            await saveCustomFood(formData);
            revalidatePath('/calorie/settings');
          }} className="space-y-4 mb-8">
            <div>
              <label htmlFor="foodName" className="block text-sm font-medium text-gray-700">料理名</label>
              <input
                type="text"
                id="foodName"
                name="foodName"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="foodCalories" className="block text-sm font-medium text-gray-700">カロリー (kcal)</label>
              <input
                type="number"
                id="foodCalories"
                name="foodCalories"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline"
            >
              カスタム料理を追加
            </button>
          </form>

          <h3 className="text-xl font-semibold mb-2">登録済みカスタム料理</h3>
          {customFoods.length === 0 ? (
            <p className="text-gray-500">カスタム料理はまだ登録されていません。</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {customFoods.map((food) => (
                <li key={food.id} className="py-3 flex justify-between items-center">
                  <span>{food.name}: {food.calories} kcal</span>
                  <form action={async () => {
                    'use server';
                    await deleteCustomFood(food.id);
                    revalidatePath('/calorie/settings');
                  }}>
                    <button
                      type="submit"
                      className="bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded"
                    >
                      削除
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}