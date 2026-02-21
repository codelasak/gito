import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [tasks, completedTasks, prayerLogs, tasksByBlock] = await Promise.all([
      prisma.task.count({
        where: { userId, date: { gte: thirtyDaysAgo } },
      }),
      prisma.task.count({
        where: { userId, completed: true, date: { gte: thirtyDaysAgo } },
      }),
      prisma.prayerLog.count({
        where: { userId, completed: true, date: { gte: thirtyDaysAgo } },
      }),
      prisma.task.groupBy({
        by: ["prayerBlock"],
        where: { userId, completed: true, date: { gte: thirtyDaysAgo } },
        _count: true,
      }),
    ]);

    // Baraka Score calculation
    // 60% prayer completion + 40% task completion
    const totalPossiblePrayers = 30 * 5; // 5 prayers * 30 days
    const prayerRate = prayerLogs / totalPossiblePrayers;
    const taskRate = tasks > 0 ? completedTasks / tasks : 0;
    const barakaScore = Math.round((prayerRate * 0.6 + taskRate * 0.4) * 100);

    // Find peak focus time (which prayer block has most completed tasks)
    const peakBlock = tasksByBlock.sort(
      (a: { _count: number }, b: { _count: number }) => b._count - a._count
    )[0];

    // Focus by prayer data
    const focusByPrayer = tasksByBlock.map(
      (t: { prayerBlock: string; _count: number }) => ({
        block: t.prayerBlock,
        count: t._count,
      })
    );

    return NextResponse.json({
      barakaScore,
      totalTasks: tasks,
      completedTasks,
      completedPrayers: prayerLogs,
      taskCompletionRate: Math.round(taskRate * 100),
      prayerCompletionRate: Math.round(prayerRate * 100),
      peakFocusBlock: peakBlock?.prayerBlock || null,
      focusByPrayer,
    });
  } catch {
    return NextResponse.json(
      { error: "Analitik verileri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
