"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addAchiever(name: string, gold: number) {
  // Validate name: 4 uppercase alphabetic characters
  if (!/^[A-Z]{1,4}$/.test(name)) {
    return { error: "Name must be 1 to 4 uppercase alphabetic characters." };
  }

  // Enforce gold cap
  let cappedGold = gold;
  if (cappedGold > 65535) {
    cappedGold = 65535;
  }
  if (cappedGold < 0) { // Also ensure non-negative
      cappedGold = 0;
  }

  try {
    const newAchiever = await prisma.pokerAchiever.create({
      data: {
        name,
        finalGold: cappedGold, // Use the capped gold value
      },
    });
    revalidatePath("/poker"); // Revalidate the poker page to show updated ranking
    return { success: true, data: newAchiever };
  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint violation
      return { error: `Achiever with name '${name}' already exists.` };
    }
    console.error("Error adding poker achiever:", error);
    return { error: "Failed to add achiever." };
  }
}

export async function getAchievers() {
  try {
    const achievers = await prisma.pokerAchiever.findMany({
      orderBy: {
        finalGold: "desc", // Order by final gold, highest first
      },
      take: 10, // Get top 10 achievers, adjust as needed
    });
    return { success: true, data: achievers };
  } catch (error) {
    console.error("Error fetching poker achievers:", error);
    return { error: "Failed to fetch achievers." };
  }
}