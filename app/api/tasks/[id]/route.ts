import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id: string }).id;
    const body = await req.json();

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== userId) {
      return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: body.title ?? task.title,
        description: body.description ?? task.description,
        prayerBlock: body.prayerBlock ?? task.prayerBlock,
        completed: body.completed ?? task.completed,
        color: body.color ?? task.color,
        startTime: body.startTime ?? task.startTime,
        endTime: body.endTime ?? task.endTime,
      },
    });

    return NextResponse.json(updatedTask);
  } catch {
    return NextResponse.json(
      { error: "Görev güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id: string }).id;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== userId) {
      return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ message: "Görev silindi" });
  } catch {
    return NextResponse.json(
      { error: "Görev silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
