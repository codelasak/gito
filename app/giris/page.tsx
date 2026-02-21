"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-posta veya şifre hatalı");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Giriş sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1 className="auth-logo">GİTO 🌙</h1>
      <p className="auth-tagline">
        Namazını kıl, görevlerini tamamla,<br />
        Baraka Skorunu yükselt!
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              background: "#FEE2E2",
              color: "#DC2626",
              padding: "var(--space-md)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-md)",
              fontSize: "0.85rem",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">E-posta</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@gito.edu.tr"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Şifre</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      <p className="auth-switch">
        Hesabın yok mu?{" "}
        <Link href="/kayit">Kayıt Ol</Link>
      </p>
    </div>
  );
}
