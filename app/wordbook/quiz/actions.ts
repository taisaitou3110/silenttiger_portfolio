"use server";

import prisma from "@/lib/prisma";

// 型定義
interface WordWithExample {
  id: string;
  term: string;
  mainDefinition: string;
  example: string;
  incorrectTerms: string[]; // 不正解の選択肢として使う単語
}

export async function getRandomWordsWithExamples(count: number = 5): Promise<WordWithExample[]> {
  try {
    const allWords = await prisma.word.findMany({
      where: {
        comments: {
          not: null, // comments が null でない単語のみ
        },
      },
      orderBy: {
        // ランダムに取得するために、適当なオフセットをスキップする（簡易的な方法）
        // 大規模なデータでは効率が悪いが、今回は許容する
        id: 'asc' // 適当な orderBy を指定
      },
    });

    const wordsWithExamples: WordWithExample[] = [];
    const availableWords = allWords.filter(word => {
      try {
        const comments = word.comments ? JSON.parse(word.comments) : [];
        return Array.isArray(comments) && comments.length > 0 && comments[0].example;
      } catch {
        return false;
      }
    });

    // クイズに必要な数だけランダムに選ぶ
    const shuffledWords = availableWords.sort(() => 0.5 - Math.random());
    const selectedForQuiz = shuffledWords.slice(0, count);

    for (const word of selectedForQuiz) {
      const comments = JSON.parse(word.comments as string);
      const mainDefinition = word.description.split(',')[0];
      const example = comments[0].example;

      // 不正解の選択肢を生成 (正解以外の単語からランダムに3つ選ぶ)
      const otherTerms = availableWords
        .filter(w => w.id !== word.id)
        .map(w => w.term)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3); // 3つ選ぶ

      wordsWithExamples.push({
        id: word.id,
        term: word.term,
        mainDefinition: mainDefinition,
        example: example,
        incorrectTerms: otherTerms,
      });
    }

    return wordsWithExamples;

  } catch (error) {
    console.error("Failed to fetch words for quiz:", error);
    return [];
  }
}
