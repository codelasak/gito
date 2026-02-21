"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function KayitPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kayıt sırasında bir hata oluştu");
        return;
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/giris");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Kayıt sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1 className="auth-logo">GİTO 🌙</h1>
      <p className="auth-tagline">
        Yeni bir yolculuğa başla!<br />
        Üretkenliğini namazla birleştir.
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
          <label className="form-label">Ad Soyad</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ayşe Yılmaz"
            required
          />
        </div>

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
            placeholder="En az 6 karakter"
            required
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Şifre Tekrar</label>
          <input
            type="password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Şifreyi tekrar girin"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
        </button>
      </form>

      <p className="auth-switch">
        Zaten hesabın var mı?{" "}
        <Link href="/giris">Giriş Yap</Link>
      </p>
    </div>
  );
}
