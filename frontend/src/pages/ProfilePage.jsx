import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import ResourceModal from "../components/ui/ResourceModal";
import { ResourceAlert } from "../components/ui/ResourceState";
import { useAuth } from "../context/AuthContext";
import { extractApiError, formatDate } from "../utils/data";

import "../styles/profile.css";
import "../styles/management.css";

const roleLabels = {
  admin: "Administrator",
  mentor: "Омӯзгор",
  student: "Донишҷӯ",
  user: "User",
};

const emptyForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  birth_date: "",
  address: "",
  level: "junior",
};

function getFullName(user) {
  const name = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user?.username || "User";
}

function ProfilePage() {
  const { currentUser, role, loadCurrentUser, authLoading } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = currentUser?.user;
  const profile = currentUser?.profile;
  const fullName = getFullName(user);

  const mentorGroups = useMemo(
    () => (Array.isArray(profile?.groups) ? profile.groups : []),
    [profile],
  );

  const educationHistory = useMemo(
    () =>
      Array.isArray(profile?.education_history)
        ? profile.education_history
        : [],
    [profile],
  );

  const detailPath =
    role === "student" && profile?.id
      ? `/students/${profile.id}`
      : role === "mentor" && profile?.id
        ? `/mentors/${profile.id}`
        : null;

  useEffect(() => {
    setForm({
      username: user?.username || "",
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
      birth_date: profile?.birth_date || "",
      address: profile?.address || "",
      level: profile?.level || "junior",
    });
  }, [profile, user]);

  function openEdit() {
    setError("");
    setSuccess("");
    setEditOpen(true);
  }

  function closeEdit() {
    if (!saving) setEditOpen(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      username: form.username.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
    };

    if (role === "mentor" || role === "student") {
      payload.birth_date = form.birth_date;
      payload.address = form.address.trim();
    }

    if (role === "mentor") {
      payload.level = form.level;
    }

    try {
      await api.patch("/accounts/me/", payload);
      await loadCurrentUser();
      setEditOpen(false);
      setSuccess("Профил бомуваффақият нав карда шуд.");
    } catch (requestError) {
      setError(
        extractApiError(requestError, "Профил нав карда нашуд."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function refreshProfile() {
    setError("");
    try {
      await loadCurrentUser();
      setSuccess("Маълумот аз сервер аз нав гирифта шуд.");
    } catch (requestError) {
      setError(
        extractApiError(requestError, "Маълумоти профил гирифта нашуд."),
      );
    }
  }

  return (
    <MainLayout
      title="Профили ман"
      description="Маълумоти ҳисоб ва профили вобастаи худро бинед ва тағйир диҳед."
    >
      <div className="profile-page management-page">
        <ResourceAlert type="error" onClose={() => setError("")}>
          {error}
        </ResourceAlert>
        <ResourceAlert type="success" onClose={() => setSuccess("")}>
          {success}
        </ResourceAlert>

        <section className="profile-hero management-profile-hero">
          <div className="profile-avatar-large">
            {fullName.charAt(0).toUpperCase()}
          </div>

          <div className="profile-hero-copy">
            <span className="profile-role-label">
              {roleLabels[role] || "User"}
            </span>
            <h2>{fullName}</h2>
            <p>@{user?.username || "—"}</p>
          </div>

          <div className="profile-hero-actions management-action-stack">
            <button
              type="button"
              className="management-primary-button"
              onClick={openEdit}
            >
              ✎ Таҳрири профил
            </button>

            {detailPath && (
              <Link to={detailPath} className="profile-primary-link">
                Профили пурра →
              </Link>
            )}

            <button
              type="button"
              className="profile-refresh-button"
              onClick={refreshProfile}
              disabled={authLoading}
            >
              {authLoading ? "Гирифта истодааст..." : "Аз нав гирифтан"}
            </button>
          </div>
        </section>

        <section className="profile-information-grid">
          <article className="profile-info-card management-info-card">
            <span>Email</span>
            <strong>{user?.email || "Ворид нашудааст"}</strong>
          </article>

          <article className="profile-info-card management-info-card">
            <span>Телефон</span>
            <strong>{user?.phone_number || "Ворид нашудааст"}</strong>
          </article>

          <article className="profile-info-card management-info-card">
            <span>Санаи таваллуд</span>
            <strong>
              {role === "admin" ? "Ба admin тааллуқ надорад" : formatDate(profile?.birth_date)}
            </strong>
          </article>

          <article className="profile-info-card management-info-card">
            <span>Суроға</span>
            <strong>
              {role === "admin"
                ? "Ба admin тааллуқ надорад"
                : profile?.address || "Ворид нашудааст"}
            </strong>
          </article>
        </section>

        {role === "student" && (
          <section className="profile-section management-section">
            <header className="profile-section-header">
              <div>
                <span>STUDENT OVERVIEW</span>
                <h3>Таҳсили ҳозира</h3>
              </div>
            </header>

            {profile?.active_group ? (
              <div className="profile-active-grid">
                <Link
                  to={`/groups/${profile.active_group.group_id}`}
                  className="profile-related-card"
                >
                  <span>Гурӯҳи фаъол</span>
                  <strong>{profile.active_group.group_title}</strong>
                  <small>{profile.active_group.branch || "—"}</small>
                </Link>

                <Link
                  to={`/courses/${profile.active_group.course_id}`}
                  className="profile-related-card"
                >
                  <span>Курси фаъол</span>
                  <strong>{profile.active_group.course_title}</strong>
                  <small>
                    {Number(
                      profile.active_group.course_price || 0,
                    ).toLocaleString()} сомонӣ
                  </small>
                </Link>
              </div>
            ) : (
              <div className="profile-empty-state">
                Барои ин донишҷӯ гурӯҳи фаъол вуҷуд надорад.
              </div>
            )}

            {educationHistory.length > 0 && (
              <div className="profile-history-list">
                {educationHistory.map((item) => (
                  <article
                    className="profile-history-item"
                    key={item.enrollment_id}
                  >
                    <div>
                      <strong>{item.course_title}</strong>
                      <span>
                        {item.group_title} · {item.branch || "—"}
                      </span>
                    </div>
                    <b>{item.status}</b>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {role === "mentor" && (
          <section className="profile-section management-section">
            <header className="profile-section-header">
              <div>
                <span>MENTOR OVERVIEW</span>
                <h3>Гурӯҳҳои вобаста</h3>
              </div>
              <strong>{mentorGroups.length} гурӯҳ</strong>
            </header>

            {mentorGroups.length === 0 ? (
              <div className="profile-empty-state">
                Ба ин омӯзгор ҳоло гурӯҳ пайваст нашудааст.
              </div>
            ) : (
              <div className="profile-related-grid">
                {mentorGroups.map((group) => (
                  <Link
                    to={`/groups/${group.group_id}`}
                    className="profile-related-card"
                    key={group.mentor_enrollment_id || group.group_id}
                  >
                    <span>{group.course_title || "Курс"}</span>
                    <strong>{group.group_title}</strong>
                    <small>
                      {group.branch || "—"} · {group.group_status || "—"}
                    </small>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="profile-section management-section">
          <header className="profile-section-header">
            <div>
              <span>QUICK LINKS</span>
              <h3>Гузариши зуд</h3>
            </div>
          </header>

          <div className="profile-quick-links">
            <Link to="/courses">Курсҳо</Link>
            <Link to="/groups">Гурӯҳҳо</Link>
            <Link to="/timetables">Ҷадвали дарсӣ</Link>
            <Link to="/grades">Баҳоҳо</Link>
            <Link to="/exam-grades">Баҳои имтиҳон</Link>
          </div>
        </section>
      </div>

      <ResourceModal
        open={editOpen}
        title="Таҳрири профил"
        description="Маълумоти ҳисобро иваз карда, тугмаи Сабтро пахш кунед."
        submitLabel="Сабт кардани тағйирот"
        loading={saving}
        onClose={closeEdit}
        onSubmit={handleSave}
      >
        <div className="resource-form-grid management-form-grid">
          <label className="resource-field">
            <span>Username</span>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>

          <label className="resource-field">
            <span>Телефон</span>
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              required
            />
          </label>

          <label className="resource-field">
            <span>Ном</span>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
            />
          </label>

          <label className="resource-field">
            <span>Насаб</span>
            <input
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
            />
          </label>

          <label className="resource-field resource-field-full">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          {(role === "mentor" || role === "student") && (
            <>
              <label className="resource-field">
                <span>Санаи таваллуд</span>
                <input
                  type="date"
                  name="birth_date"
                  value={form.birth_date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="resource-field">
                <span>Суроға</span>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </label>
            </>
          )}

          {role === "mentor" && (
            <label className="resource-field resource-field-full">
              <span>Сатҳи омӯзгор</span>
              <select name="level" value={form.level} onChange={handleChange}>
                <option value="junior">Junior</option>
                <option value="middle">Middle</option>
                <option value="senior">Senior</option>
              </select>
            </label>
          )}
        </div>
      </ResourceModal>
    </MainLayout>
  );
}

export default ProfilePage;
