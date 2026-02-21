"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AddTaskModal from "@/components/AddTaskModal";
import {
  PrayerTimes,
  getPrayerTimesInfo,
  getTimeUntilNextPrayer,
  getPrayerBlockLabel,
} from "@/lib/prayer-times";

interface Task {
  id: string;
  title: string;
  description: string | null;
  prayerBlock: string;
  completed: boolean;
  date: string;
  startTime: string | null;
  endTime: string | null;
  color: string;
}

const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, nextPrayer: "" });
  const [loading, setLoading] = useState(true);

  // Get week days
  const getWeekDays = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  };

  const weekDays = getWeekDays();

  const fetchData = useCallback(async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];

      const [prayerRes, tasksRes] = await Promise.all([
        fetch(`/api/prayers?date=${dateStr}`),
        session ? fetch(`/api/tasks?date=${dateStr}`) : Promise.resolve(null),
      ]);

      const prayerData = await prayerRes.json();
      setPrayerTimes(prayerData.prayerTimes);

      if (tasksRes) {
        const tasksData = await tasksRes.json();
        if (Array.isArray(tasksData)) {
          setTasks(tasksData);
        }
      }
    } catch (error) {
      console.error("Veri yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    if (!prayerTimes) return;

    const updateCountdown = () => {
      setCountdown(getTimeUntilNextPrayer(prayerTimes));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    prayerBlock: string;
    date: string;
    startTime: string;
    endTime: string;
    color: string;
  }) => {
    if (!session) {
      router.push("/giris");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Görev eklenirken hata:", error);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!session) return;

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !completed } : t))
      );
    } catch (error) {
      console.error("Görev güncellenirken hata:", error);
    }
  };

  const prayerInfo = prayerTimes
    ? getPrayerTimesInfo(prayerTimes)
    : [];

  // Group tasks by prayer block
  const tasksByBlock = tasks.reduce(
    (acc, task) => {
      if (!acc[task.prayerBlock]) acc[task.prayerBlock] = [];
      acc[task.prayerBlock].push(task);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSameDay = (a: Date, b: Date) => {
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Bugün</h1>
          <p className="page-subtitle">
            {selectedDate.toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button className="notification-bell">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>

      {/* Next Prayer Banner */}
      {prayerTimes && (
        <div className="next-prayer-banner animate-in">
          <div>
            <p className="next-prayer-label">Sonraki namaz</p>
            <p className="next-prayer-name">{countdown.nextPrayer}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="countdown-text">
              {String(countdown.hours).padStart(2, "0")}:
              {String(countdown.minutes).padStart(2, "0")}:
              {String(countdown.seconds).padStart(2, "0")}
            </p>
          </div>
        </div>
      )}

      {/* Week Day Selector */}
      <div className="week-selector">
        {weekDays.map((day, i) => (
          <button
            key={i}
            className={`week-day ${isSameDay(day, selectedDate) ? "active" : ""} ${isToday(day) ? "today" : ""}`}
            onClick={() => setSelectedDate(new Date(day))}
          >
            <span className="week-day-name">{DAYS_TR[i]}</span>
            <span className="week-day-num">{day.getDate()}</span>
          </button>
        ))}
      </div>

      {/* Section Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Bugünün Görevleri</h2>
          <p className="section-subtitle">Namaz vakitlerine göre planla</p>
        </div>
      </div>

      {/* Prayer Timeline with Tasks */}
      <div className="prayer-timeline">
        {prayerInfo.map((prayer, index) => {
          const blockKey = index < 4
            ? `${prayer.nameEn}_${prayerInfo[index + 1]?.nameEn}`
            : `${prayer.nameEn}_Fajr`;
          const blockTasks = tasksByBlock[blockKey] || [];

          return (
            <div key={prayer.nameEn} className="prayer-timeline-item animate-in">
              <div className="prayer-timeline-line">
                <div
                  className={`prayer-dot ${
                    prayer.isNext ? "active" : prayer.isPast ? "past" : ""
                  }`}
                />
                {index < prayerInfo.length - 1 && (
                  <div
                    className={`prayer-connector ${prayer.isNext ? "active" : ""}`}
                  />
                )}
              </div>

              <div className="prayer-info" style={{ paddingBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="prayer-name">{prayer.name}</span>
                  <span className="prayer-time-text">{prayer.time}</span>
                </div>

                {blockTasks.length > 0 && (
                  <div className="prayer-tasks-area">
                    {blockTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`task-card ${task.completed ? "completed" : ""}`}
                        data-block={task.prayerBlock}
                      >
                        <div className="task-info">
                          <p className="task-title">{task.title}</p>
                          {task.startTime && (
                            <p className="task-time">
                              {task.startTime}
                              {task.endTime ? ` — ${task.endTime}` : ""}
                            </p>
                          )}
                        </div>
                        <button
                          className={`task-check ${task.completed ? "checked" : ""}`}
                          onClick={() => handleToggleTask(task.id, task.completed)}
                        >
                          {task.completed && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {blockTasks.length === 0 && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {getPrayerBlockLabel(blockKey)} — görev yok
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <button className="fab" onClick={() => setShowAddModal(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
        selectedDate={selectedDate.toISOString().split("T")[0]}
      />

      {/* Show login prompt for non-authenticated users */}
      {status === "unauthenticated" && tasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🕌</div>
          <p className="empty-state-title">Hoş Geldin!</p>
          <p className="empty-state-text">
            Görevlerini takip etmek ve Baraka Skorunu yükseltmek için giriş yap.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: "var(--space-md)", maxWidth: "200px", margin: "var(--space-md) auto 0" }}
            onClick={() => router.push("/giris")}
          >
            Giriş Yap
          </button>
        </div>
      )}
    </>
  );
}
