export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface PrayerTimeInfo {
  name: string;
  nameEn: string;
  time: string;
  isPast: boolean;
  isNext: boolean;
}

const PRAYER_NAMES_TR: Record<string, string> = {
  Fajr: "İmsak",
  Dhuhr: "Öğle",
  Asr: "İkindi",
  Maghrib: "Akşam",
  Isha: "Yatsı",
};

const PRAYER_BLOCK_LABELS: Record<string, string> = {
  Fajr_Dhuhr: "İmsak — Öğle",
  Dhuhr_Asr: "Öğle — İkindi",
  Asr_Maghrib: "İkindi — Akşam",
  Maghrib_Isha: "Akşam — Yatsı",
  Isha_Fajr: "Yatsı — İmsak",
};

const PRAYER_BLOCK_COLORS: Record<string, string> = {
  Fajr_Dhuhr: "#B8A9FC",
  Dhuhr_Asr: "#F8BBD0",
  Asr_Maghrib: "#FFE0B2",
  Maghrib_Isha: "#C8E6C9",
  Isha_Fajr: "#B3E5FC",
};

export function getPrayerNameTR(name: string): string {
  return PRAYER_NAMES_TR[name] || name;
}

export function getPrayerBlockLabel(block: string): string {
  return PRAYER_BLOCK_LABELS[block] || block;
}

export function getPrayerBlockColor(block: string): string {
  return PRAYER_BLOCK_COLORS[block] || "#B8A9FC";
}

export async function fetchPrayerTimes(
  city: string = "Istanbul",
  country: string = "Turkey",
  date?: Date
): Promise<PrayerTimes> {
  const d = date || new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  const url = `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=13`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    const timings = data.data.timings;

    return {
      Fajr: timings.Fajr,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
    };
  } catch {
    // Fallback prayer times for Istanbul
    return {
      Fajr: "05:30",
      Dhuhr: "12:30",
      Asr: "15:30",
      Maghrib: "18:00",
      Isha: "19:30",
    };
  }
}

export function getPrayerTimesInfo(
  prayerTimes: PrayerTimes,
  now: Date = new Date()
): PrayerTimeInfo[] {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const prayers = Object.entries(prayerTimes);
  let nextFound = false;

  return prayers.map(([nameEn, time]) => {
    const [hours, minutes] = time.split(":").map(Number);
    const prayerMinutes = hours * 60 + minutes;
    const isPast = currentMinutes >= prayerMinutes;
    const isNext = !isPast && !nextFound;

    if (isNext) nextFound = true;

    return {
      name: PRAYER_NAMES_TR[nameEn],
      nameEn,
      time,
      isPast,
      isNext,
    };
  });
}

export function getTimeUntilNextPrayer(
  prayerTimes: PrayerTimes,
  now: Date = new Date()
): { hours: number; minutes: number; seconds: number; nextPrayer: string } {
  const currentSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const prayers = Object.entries(prayerTimes);

  for (const [nameEn, time] of prayers) {
    const [hours, minutes] = time.split(":").map(Number);
    const prayerSeconds = hours * 3600 + minutes * 60;

    if (prayerSeconds > currentSeconds) {
      const diff = prayerSeconds - currentSeconds;
      return {
        hours: Math.floor(diff / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
        nextPrayer: PRAYER_NAMES_TR[nameEn],
      };
    }
  }

  // If all prayers are past, next prayer is tomorrow's Fajr
  const [fajrH, fajrM] = prayerTimes.Fajr.split(":").map(Number);
  const fajrSeconds = fajrH * 3600 + fajrM * 60;
  const diff = 86400 - currentSeconds + fajrSeconds;

  return {
    hours: Math.floor(diff / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
    nextPrayer: "İmsak",
  };
}

export function getCurrentPrayerBlock(prayerTimes: PrayerTimes, now: Date = new Date()): string {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const fajr = toMin(prayerTimes.Fajr);
  const dhuhr = toMin(prayerTimes.Dhuhr);
  const asr = toMin(prayerTimes.Asr);
  const maghrib = toMin(prayerTimes.Maghrib);
  const isha = toMin(prayerTimes.Isha);

  if (currentMinutes >= isha || currentMinutes < fajr) return "Isha_Fajr";
  if (currentMinutes >= maghrib) return "Maghrib_Isha";
  if (currentMinutes >= asr) return "Asr_Maghrib";
  if (currentMinutes >= dhuhr) return "Dhuhr_Asr";
  return "Fajr_Dhuhr";
}
