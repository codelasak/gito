"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/giris");
    return null;
  }

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "G";

  return (
    <>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <p className="profile-name">{user?.name || "GİTO Öğrencisi"}</p>
        <p className="profile-email">{user?.email}</p>
      </div>

      {/* Genel Settings */}
      <div className="settings-section">
        <p className="settings-section-title">Genel</p>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-icon" style={{ background: "var(--purple-100)" }}>
              👤
            </div>
            <span className="settings-item-text">Profil Düzenle</span>
            <span className="settings-item-arrow">›</span>
          </div>
          <div className="settings-item">
            <div className="settings-item-icon" style={{ background: "var(--green-100)" }}>
              🕌
            </div>
            <span className="settings-item-text">Namaz Vakti Ayarları</span>
            <span className="settings-item-arrow">›</span>
          </div>
          <div className="settings-item">
            <div className="settings-item-icon" style={{ background: "var(--purple-100)" }}>
              🔔
            </div>
            <span className="settings-item-text">Bildirimler</span>
            <span className="settings-item-arrow">›</span>
          </div>
        </div>
      </div>

      {/* Görünüm Settings */}
      <div className="settings-section">
        <p className="settings-section-title">Görünüm</p>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-icon" style={{ background: "var(--purple-100)" }}>
              🎨
            </div>
            <span className="settings-item-text">Tema</span>
            <span className="settings-item-arrow">›</span>
          </div>
          <div className="settings-item">
            <div className="settings-item-icon" style={{ background: "var(--green-100)" }}>
              🌐
            </div>
            <span className="settings-item-text">Dil ve Tarih</span>
            <span className="settings-item-arrow">›</span>
          </div>
        </div>
      </div>

      {/* Diğer Settings */}
      <div className="settings-section">
        <p className="settings-section-title">Diğer</p>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-icon" style={{ background: "var(--gray-100)" }}>
              📄
            </div>
            <span className="settings-item-text">Gizlilik Politikası</span>
            <span className="settings-item-arrow">›</span>
          </div>
          <div className="settings-item">
            <div className="settings-item-icon" style={{ background: "var(--gray-100)" }}>
              ℹ️
            </div>
            <span className="settings-item-text">Hakkında</span>
            <span className="settings-item-arrow">›</span>
          </div>
          <button
            className="settings-item"
            onClick={() => signOut({ callbackUrl: "/giris" })}
            style={{ width: "100%", textAlign: "left" }}
          >
            <div className="settings-item-icon" style={{ background: "#FEE2E2" }}>
              🚪
            </div>
            <span className="settings-item-text" style={{ color: "#DC2626" }}>
              Çıkış Yap
            </span>
            <span className="settings-item-arrow">›</span>
          </button>
        </div>
      </div>

      {/* App Version */}
      <div style={{ textAlign: "center", padding: "var(--space-lg)", color: "var(--text-muted)", fontSize: "0.75rem" }}>
        GİTO Ramazan v1.0 🌙
      </div>
    </>
  );
}
