"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getPrayerBlockLabel } from "@/lib/prayer-times";

interface Task {
  id: string;
  title: string;
  prayerBlock: string;
  completed: boolean;
  date: string;
  startTime: string | null;
  color: string;
}

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function TakvimPage() {
  const { data: session } = useSession();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    if (!session) return;
    const dateStr = selectedDate.toISOString().split("T")[0];
    try {
      const res = await fetch(`/api/tasks?date=${dateStr}`);
      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
    } catch (error) {
      console.error("Görevler yüklenirken hata:", error);
    }
  }, [session, selectedDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Previous month days
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isOtherMonth: true });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isOtherMonth: false });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isOtherMonth: true });
    }

    return days;
  };

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

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const calendarDays = getDaysInMonth(currentMonth);

  // Group tasks by prayer block for selected date
  const tasksByBlock: Record<string, Task[]> = {};
  tasks.forEach((task) => {
    if (!tasksByBlock[task.prayerBlock]) tasksByBlock[task.prayerBlock] = [];
    tasksByBlock[task.prayerBlock].push(task);
  });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Takvim</h1>
        <p className="page-subtitle">
          {selectedDate.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        {(["daily", "weekly", "monthly"] as const).map((v) => (
          <button
            key={v}
            className={`view-toggle-btn ${view === v ? "active" : ""}`}
            onClick={() => setView(v)}
          >
            {v === "daily" ? "Günlük" : v === "weekly" ? "Haftalık" : "Aylık"}
          </button>
        ))}
      </div>

      {/* Month Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 var(--space-md)",
          marginBottom: "var(--space-md)",
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-full)",
            background: "var(--gray-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ‹
        </button>
        <span style={{ fontWeight: 600, fontSize: "1rem" }}>
          {MONTHS_TR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          onClick={nextMonth}
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-full)",
            background: "var(--gray-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ›
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {DAYS_TR.map((day) => (
          <div key={day} className="calendar-header-cell">
            {day}
          </div>
        ))}
        {calendarDays.map((day, i) => (
          <button
            key={i}
            className={`calendar-cell ${isToday(day.date) ? "today" : ""} ${
              isSameDay(day.date, selectedDate) ? "selected" : ""
            } ${day.isOtherMonth ? "other-month" : ""}`}
            onClick={() => setSelectedDate(new Date(day.date))}
          >
            {day.date.getDate()}
          </button>
        ))}
      </div>

      {/* Scheduled Tasks for Selected Date */}
      <div className="scheduled-section">
        <h2 className="scheduled-title">Planlanmış</h2>

        {Object.keys(tasksByBlock).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p className="empty-state-title">Bu gün için görev yok</p>
            <p className="empty-state-text">
              Bir görev eklemek için + butonuna dokun
            </p>
          </div>
        ) : (
          Object.entries(tasksByBlock).map(([block, blockTasks]) => (
            <div key={block} style={{ marginBottom: "var(--space-md)" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "var(--space-sm)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {getPrayerBlockLabel(block)}
              </p>
              {blockTasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-card ${task.completed ? "completed" : ""}`}
                  data-block={task.prayerBlock}
                  style={{ marginBottom: "var(--space-sm)" }}
                >
                  <div className="task-info">
                    <p className="task-title">{task.title}</p>
                    {task.startTime && (
                      <p className="task-time">{task.startTime}</p>
                    )}
                  </div>
                  <div
                    className={`task-check ${task.completed ? "checked" : ""}`}
                  >
                    {task.completed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
