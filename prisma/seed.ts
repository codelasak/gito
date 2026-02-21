import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seed başlatılıyor...");

  // Örnek kullanıcı oluştur
  const hashedPassword = await bcrypt.hash("gito2026", 12);

  const user = await prisma.user.upsert({
    where: { email: "ayse@gito.edu.tr" },
    update: {},
    create: {
      name: "Ayşe Yılmaz",
      email: "ayse@gito.edu.tr",
      password: hashedPassword,
      city: "Istanbul",
    },
  });

  console.log(`✅ Kullanıcı oluşturuldu: ${user.name} (${user.email})`);

  // Bugünün tarihi
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Örnek görevler
  const tasks = [
    { title: "Matematik denemesi çöz", prayerBlock: "Fajr_Dhuhr" as const, startTime: "08:00", endTime: "09:30", color: "#B8A9FC" },
    { title: "İngilizce kelime çalış", prayerBlock: "Fajr_Dhuhr" as const, startTime: "10:00", endTime: "11:00", color: "#F8BBD0" },
    { title: "Kur'an-ı Kerim oku", prayerBlock: "Dhuhr_Asr" as const, startTime: "13:30", endTime: "14:00", color: "#C8E6C9" },
    { title: "Fizik soruları çöz", prayerBlock: "Dhuhr_Asr" as const, startTime: "14:00", endTime: "15:00", color: "#FFE0B2" },
    { title: "Podcast dinle", prayerBlock: "Asr_Maghrib" as const, startTime: "16:30", endTime: "17:00", color: "#FFE0B2" },
    { title: "Yürüyüşe çık", prayerBlock: "Asr_Maghrib" as const, startTime: "17:00", endTime: "18:00", color: "#B3E5FC" },
    { title: "Kur'an oku", prayerBlock: "Maghrib_Isha" as const, startTime: "19:00", endTime: "19:30", color: "#C8E6C9" },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        ...task,
        date: today,
        userId: user.id,
      },
    });
  }

  console.log(`✅ ${tasks.length} görev oluşturuldu`);

  // Örnek namaz kayıtları
  const prayers = ["Fajr", "Dhuhr", "Asr"] as const;
  for (const prayer of prayers) {
    await prisma.prayerLog.upsert({
      where: {
        userId_prayer_date: {
          userId: user.id,
          prayer,
          date: today,
        },
      },
      update: {},
      create: {
        userId: user.id,
        prayer,
        completed: true,
        date: today,
      },
    });
  }

  console.log("✅ Namaz kayıtları oluşturuldu");
  console.log("\n🎉 Seed tamamlandı!");
  console.log("📧 E-posta: ayse@gito.edu.tr");
  console.log("🔑 Şifre: gito2026");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
