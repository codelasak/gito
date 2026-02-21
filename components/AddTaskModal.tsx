"use client";

import { useState } from "react";
import { getPrayerBlockLabel } from "@/lib/prayer-times";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: {
    title: string;
    description: string;
    prayerBlock: string;
    date: string;
    startTime: string;
    endTime: string;
    color: string;
  }) => void;
  selectedDate?: string;
}

const COLORS = [
  "#B8A9FC",
  "#F8BBD0",
  "#FFE0B2",
  "#C8E6C9",
  "#B3E5FC",
  "#E1BEE7",
  "#FFCCBC",
  "#DCEDC8",
];

const PRAYER_BLOCKS = [
  "Fajr_Dhuhr",
  "Dhuhr_Asr",
  "Asr_Maghrib",
  "Maghrib_Isha",
  "Isha_Fajr",
];

export default function AddTaskModal({
  isOpen,
  onClose,
  onAdd,
  selectedDate,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prayerBlock, setPrayerBlock] = useState("Fajr_Dhuhr");
  const [date, setDate] = useState(
    selectedDate || new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [color, setColor] = useState("#B8A9FC");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    await onAdd({ title, description, prayerBlock, date, startTime, endTime, color });
    setLoading(false);

    // Reset
    setTitle("");
    setDescription("");
    setPrayerBlock("Fajr_Dhuhr");
    setStartTime("");
    setEndTime("");
    setColor("#B8A9FC");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Yeni Görev</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Görev Adı *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Matematik denemesi çöz"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Açıklama</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İsteğe bağlı açıklama"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Namaz Vakti Bloğu</label>
            <select
              className="form-select"
              value={prayerBlock}
              onChange={(e) => setPrayerBlock(e.target.value)}
            >
              {PRAYER_BLOCKS.map((block) => (
                <option key={block} value={block}>
                  {getPrayerBlockLabel(block)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tarih</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--space-md)" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Başlangıç</label>
              <input
                type="time"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Bitiş</label>
              <input
                type="time"
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Renk</label>
            <div className="color-options">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-option ${color === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Görevi Kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}
