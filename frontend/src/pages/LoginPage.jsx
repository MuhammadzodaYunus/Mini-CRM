import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../context/AuthContext";

import "../styles/login.css";

function LoginPage() {
  const navigate = useNavigate();
  const { loadCurrentUser } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm((previousForm) => ({
      ...previousForm,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "/api/accounts/login/",
        form
      );

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      await loadCurrentUser();
      navigate("/dashboard");
    } catch (requestError) {
      if (!requestError.response) {
        setError(
          "Ба сервер пайваст шудан нашуд. Backend-ро фаъол кунед."
        );
      } else if (requestError.response.status === 401) {
        setError("Номи корбар ё парол нодуруст аст.");
      } else {
        setError(
          requestError.response?.data?.detail ||
            "Ҳангоми воридшавӣ хато рӯй дод."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-presentation">
        <div className="presentation-glow presentation-glow-one" />
        <div className="presentation-glow presentation-glow-two" />

        <div className="brand">
          <div className="brand-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M6 10v5.2c0 1.8 2.7 3.3 6 3.3s6-1.5 6-3.3V10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <strong>EDUCATION</strong>
            <span>CRM SYSTEM</span>
          </div>
        </div>

        <div className="presentation-content">
          <span className="section-label">
            СИСТЕМАИ ИДОРАКУНӢ
          </span>

          <h1>
            Тамоми маркази таълимӣ дар як панели ягона
          </h1>

          <p>
            Донишҷӯён, омӯзгорон, курсҳо, гурӯҳҳо,
            ҷадвали дарсӣ, фаъолият ва баҳогузориро
            бо тартиби равшан идора кунед.
          </p>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-number">01</div>
              <div>
                <h3>Донишҷӯён</h3>
                <p>Профил ва сабти курсҳо</p>
              </div>
            </article>

            <article className="feature-card">
              <div className="feature-number">02</div>
              <div>
                <h3>Гурӯҳҳо</h3>
                <p>Курс ва ҷадвали дарсӣ</p>
              </div>
            </article>

            <article className="feature-card">
              <div className="feature-number">03</div>
              <div>
                <h3>Назорат</h3>
                <p>Фаъолият ва баҳогузорӣ</p>
              </div>
            </article>
          </div>
        </div>

        <footer className="presentation-footer">
          <span>Education Management Platform</span>
          <span>2026</span>
        </footer>
      </section>

      <section className="login-form-section">
        <div className="mobile-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24">
              <path
                d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M6 10v5.2c0 1.8 2.7 3.3 6 3.3s6-1.5 6-3.3V10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          <strong>EDUCATION CRM</strong>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <header className="form-header">
            <span className="form-label">
              ВОРИДШАВӢ БА СИСТЕМА
            </span>

            <h2>Хуш омадед</h2>

            <p>
              Номи корбар ва пароли худро ворид кунед.
            </p>
          </header>

          <div className="form-field">
            <label htmlFor="username">
              Номи корбар
            </label>

            <div className="input-wrapper">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M4.5 21c.6-4.2 3.2-6.5 7.5-6.5s6.9 2.3 7.5 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="Номи корбар"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="password">
              Парол
            </label>

            <div className="input-wrapper">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect
                  x="4"
                  y="10"
                  width="16"
                  height="11"
                  rx="3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Пароли шумо"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="login-error">
              <svg viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M12 7v6M12 17h.01"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <span>{error}</span>
            </div>
          )}

          <button
            className="submit-button"
            type="submit"
            disabled={loading}
          >
            <span>
              {loading
                ? "Санҷида истодааст..."
                : "Ворид шудан"}
            </span>

            {!loading && (
              <svg viewBox="0 0 24 24">
                <path
                  d="M5 12h14M14 7l5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          <div className="security-note">
            <span className="security-dot" />
            Пайвасти муҳофизатшуда бо JWT
          </div>
        </form>

        <footer className="form-footer">
          <span>Education CRM</span>
          <span>Маркази идоракунии таълим</span>
        </footer>
      </section>
    </main>
  );
}

export default LoginPage;