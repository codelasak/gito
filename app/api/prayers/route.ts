import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchPrayerTimes } from "@/lib/prayer-times";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || "Istanbul";
    const dateStr = searchParams.get("date");
    const date = dateStr ? new Date(dateStr) : new Date();

    const prayerTimes = await fetchPrayerTimes(city, "Turkey", date);

    // Also get prayer logs for the user if authenticated
    const session = await getServerSession(authOptions);
    let prayerLogs: { prayer: string; completed: boolean }[] = [];
    
    if (session?.user) {
      const userId = (session.user as { id: string }).id;
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      prayerLogs = await prisma.prayerLog.findMany({
        where: {
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { prayer: true, completed: true },
      });
    }

    return NextResponse.json({ prayerTimes, prayerLogs });
  } catch {
    return NextResponse.json(
      { error: "Namaz vakitleri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { prayer, completed, date } = await req.json();

    const prayerDate = new Date(date);
    prayerDate.setHours(0, 0, 0, 0);

    const prayerLog = await prisma.prayerLog.upsert({
      where: {
        userId_prayer_date: {
          userId,
          prayer,
          date: prayerDate,
        },
      },
      update: { completed },
      create: {
        userId,
        prayer,
        completed,
        date: prayerDate,
      },
    });

    return NextResponse.json(prayerLog);
  } catch {
    return NextResponse.json(
      { error: "Namaz kaydı sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
