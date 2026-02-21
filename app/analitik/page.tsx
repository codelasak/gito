"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getPrayerBlockLabel, getPrayerBlockColor } from "@/lib/prayer-times";

interface AnalyticsData {
  barakaScore: number;
  totalTasks: number;
  completedTasks: number;
  completedPrayers: number;
  taskCompletionRate: number;
  prayerCompletionRate: number;
  peakFocusBlock: string | null;
  focusByPrayer: { block: string; count: number }[];
}

export default function AnalitikPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/giris");
      return;
    }

    if (session) {
      fetch("/api/analytics")
        .then((res) => res.json())
        .then((d) => {
          setData(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <p className="empty-state-title">Henüz veri yok</p>
        <p className="empty-state-text">
          Görevlerini tamamladıkça analitik veriler burada görünecek
        </p>
      </div>
    );
  }

  const maxFocus = Math.max(...data.focusByPrayer.map((f) => f.count), 1);

  // SVG circle for Baraka Score
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (data.barakaScore / 100) * circumference;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Analitik</h1>
        <p className="page-subtitle">Son 30 günlük performansın</p>
      </div>

      {/* Baraka Score Card */}
      <div className="baraka-card animate-in">
        <p className="baraka-label">Baraka Skoru</p>
        <div className="baraka-score-circle">
          <svg width="140" height="140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <span className="baraka-score-value">{data.barakaScore}</span>
        </div>
        <p className="baraka-score-max">/ 100</p>
      </div>

      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card animate-in">
          <div className="stat-icon" style={{ background: "var(--purple-100)", color: "var(--purple-600)" }}>
            ✅
          </div>
          <p className="stat-value">{data.completedTasks}</p>
          <p className="stat-label">Tamamlanan Görev</p>
        </div>

        <div className="stat-card animate-in">
          <div className="stat-icon" style={{ background: "var(--green-100)", color: "var(--green-600)" }}>
            🕌
          </div>
          <p className="stat-value">{data.completedPrayers}</p>
          <p className="stat-label">Kılınan Namaz</p>
        </div>

        <div className="stat-card animate-in">
          <div className="stat-icon" style={{ background: "var(--purple-100)", color: "var(--purple-600)" }}>
            📈
          </div>
          <p className="stat-value">%{data.taskCompletionRate}</p>
          <p className="stat-label">Görev Tamamlama</p>
        </div>

        <div className="stat-card animate-in">
          <div className="stat-icon" style={{ background: "var(--green-100)", color: "var(--green-600)" }}>
            ⭐
          </div>
          <p className="stat-value">
            {data.peakFocusBlock
              ? getPrayerBlockLabel(data.peakFocusBlock).split(" — ")[0]
              : "—"}
          </p>
          <p className="stat-label">En Verimli Vakit</p>
        </div>
      </div>

      {/* Focus by Prayer */}
      <div className="section-header">
        <h2 className="section-title">Vakit Bazlı Odaklanma</h2>
      </div>

      <div className="focus-bars">
        {data.focusByPrayer.length === 0 ? (
          <div className="empty-state" style={{ padding: "var(--space-lg) 0" }}>
            <p className="empty-state-text">Henüz veri yok</p>
          </div>
        ) : (
          data.focusByPrayer.map((item) => (
            <div key={item.block} className="focus-bar-item animate-in">
              <span className="focus-bar-label">
                {getPrayerBlockLabel(item.block).split(" — ")[0]}
              </span>
              <div className="focus-bar-track">
                <div
                  className="focus-bar-fill"
                  style={{
                    width: `${(item.count / maxFocus) * 100}%`,
                    background: getPrayerBlockColor(item.block),
                  }}
                />
              </div>
              <span className="focus-bar-value">{item.count}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
