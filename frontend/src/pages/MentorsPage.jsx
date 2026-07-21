import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import ResourceModal from "../components/ui/ResourceModal";
import {
  ResourceAlert,
  ResourceEmpty,
  ResourceLoading,
} from "../components/ui/ResourceState";
import { useAuth } from "../context/AuthContext";
import {
  displayUsername,
  extractApiError,
  formatDate,
  normalizeList,
} from "../utils/data";

import "../styles/resources.css";
import "../styles/management.css";

const initialForm = {
  user_id: "",
  birth_date: "",
  address: "",
  level: "junior",
};

const levelLabels = {
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
};

function MentorsPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const canManage = role === "admin";

  const [mentors, setMentors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingMentor, setEditingMentor] = useState(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadMentors() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/accounts/mentors/");
      setMentors(normalizeList(response.data));
    } catch (requestError) {
      setError(
        extractApiError(requestError, "Рӯйхати омӯзгорон гирифта нашуд."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMentors();
  }, []);

  const filteredMentors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mentors.filter((mentor) => {
      if (levelFilter !== "all" && mentor.level !== levelFilter) return false;
      if (!query) return true;

      return [
        mentor.id,
        displayUsername(mentor),
        mentor.user?.first_name,
        mentor.user?.last_name,
        mentor.user?.phone_number,
        mentor.user?.email,
        mentor.address,
        mentor.level,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [levelFilter, mentors, search]);

  const levelCounts = {
    junior: mentors.filter((mentor) => mentor.level === "junior").length,
    middle: mentors.filter((mentor) => mentor.level === "middle").length,
    senior: mentors.filter((mentor) => mentor.level === "senior").length,
  };

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreateModal() {
    setEditingMentor(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(event, mentor) {
    event.stopPropagation();
    setEditingMentor(mentor);
    setForm({
      user_id: String(mentor.user?.id || ""),
      birth_date: mentor.birth_date || "",
      address: mentor.address || "",
      level: mentor.level || "junior",
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingMentor(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingMentor) {
        await api.patch(`/accounts/mentors/${editingMentor.id}/`, {
          birth_date: form.birth_date,
          address: form.address.trim(),
          level: form.level,
        });
        setSuccess("Профили омӯзгор нав карда шуд.");
      } else {
        await api.post("/accounts/mentors/", {
          user_id: Number(form.user_id),
          birth_date: form.birth_date,
          address: form.address.trim(),
          level: form.level,
        });
        setSuccess("Профили омӯзгор сохта шуд.");
      }

      closeModal();
      await loadMentors();
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          editingMentor
            ? "Профили омӯзгор нав карда нашуд."
            : "Профили омӯзгор сохта нашуд.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event, mentor) {
    event.stopPropagation();
    if (!window.confirm(`Омӯзгори «${displayUsername(mentor)}» ҳазф шавад?`)) {
      return;
    }

    setDeletingId(mentor.id);
    setError("");

    try {
      await api.delete(`/accounts/mentors/${mentor.id}/`);
      setMentors((items) => items.filter((item) => item.id !== mentor.id));
      setSuccess("Профили омӯзгор ҳазф шуд.");
    } catch (requestError) {
      setError(
        extractApiError(requestError, "Профили омӯзгор ҳазф нашуд."),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <MainLayout
      title="Омӯзгорон"
      description="Профил, сатҳ, гурӯҳҳо ва курсҳои омӯзгоронро идора кунед."
    >
      <div className="resource-page management-page">
        <ResourceAlert type="error" onClose={() => setError("")}>
          {error}
        </ResourceAlert>
        <ResourceAlert type="success" onClose={() => setSuccess("")}>
          {success}
        </ResourceAlert>

        <section className="management-spotlight management-spotlight-purple">
          <div>
            <span className="management-eyebrow">MENTOR DIRECTORY</span>
            <h2>Дастаи омӯзгорони марказ</h2>
            <p>
              Профилро кушоед, сатҳро тағйир диҳед ва гурӯҳҳои вобастаро бинед.
            </p>
          </div>
          <div className="management-spotlight-metric">
            <strong>{mentors.length}</strong>
            <span>mentor</span>
          </div>
        </section>

        <section className="resource-kpi-grid resource-kpi-grid-four">
          <article className="resource-kpi-card">
            <span>Ҳамагӣ</span>
            <strong>{mentors.length}</strong>
            <small>омӯзгор</small>
          </article>
          <article className="resource-kpi-card">
            <span>Junior</span>
            <strong>{levelCounts.junior}</strong>
            <small>омӯзгор</small>
          </article>
          <article className="resource-kpi-card">
            <span>Middle</span>
            <strong>{levelCounts.middle}</strong>
            <small>омӯзгор</small>
          </article>
          <article className="resource-kpi-card">
            <span>Senior</span>
            <strong>{levelCounts.senior}</strong>
            <small>омӯзгор</small>
          </article>
        </section>

        <section className="resource-card management-resource-card">
          <header className="resource-toolbar">
            <div className="resource-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ном, телефон, суроға ё сатҳ..."
              />
            </div>

            <div className="resource-toolbar-actions">
              <select
                className="resource-select-compact"
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
              >
                <option value="all">Ҳамаи сатҳҳо</option>
                <option value="junior">Junior</option>
                <option value="middle">Middle</option>
                <option value="senior">Senior</option>
              </select>

              <button
                type="button"
                className="resource-button resource-button-ghost"
                onClick={loadMentors}
              >
                Аз нав гирифтан
              </button>

              {canManage && (
                <button
                  type="button"
                  className="resource-button resource-button-primary"
                  onClick={openCreateModal}
                >
                  + Профили омӯзгор
                </button>
              )}
            </div>
          </header>

          {loading ? (
            <ResourceLoading />
          ) : filteredMentors.length === 0 ? (
            <ResourceEmpty
              title="Омӯзгор ёфт нашуд"
              description="Ҷустуҷӯро тағйир диҳед ё профили нав созед."
              actionLabel={canManage ? "Профили нав" : undefined}
              onAction={canManage ? openCreateModal : undefined}
            />
          ) : (
            <div className="management-mentor-grid">
              {filteredMentors.map((mentor) => (
                <article
                  className="management-mentor-card"
                  key={mentor.id}
                  onClick={() => navigate(`/mentors/${mentor.id}`)}
                >
                  <header>
                    <div className="management-person-avatar">
                      {displayUsername(mentor).charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`management-level-badge management-level-${mentor.level}`}
                    >
                      {levelLabels[mentor.level] || mentor.level}
                    </span>
                  </header>

                  <span className="management-id-label">
                    MENTOR #{String(mentor.id).padStart(3, "0")}
                  </span>
                  <h3>
                    {[mentor.user?.first_name, mentor.user?.last_name]
                      .filter(Boolean)
                      .join(" ") || displayUsername(mentor)}
                  </h3>
                  <p>@{displayUsername(mentor)}</p>

                  <div className="management-person-info">
                    <div>
                      <span>Телефон</span>
                      <strong>{mentor.user?.phone_number || "—"}</strong>
                    </div>
                    <div>
                      <span>Таваллуд</span>
                      <strong>{formatDate(mentor.birth_date)}</strong>
                    </div>
                    <div>
                      <span>Суроға</span>
                      <strong>{mentor.address || "—"}</strong>
                    </div>
                    <div>
                      <span>Гурӯҳҳо</span>
                      <strong>{mentor.groups?.length || 0}</strong>
                    </div>
                  </div>

                  <footer className="management-card-actions">
                    <button
                      type="button"
                      className="management-view-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/mentors/${mentor.id}`);
                      }}
                    >
                      Detail →
                    </button>

                    {canManage && (
                      <>
                        <button
                          type="button"
                          className="management-edit-button"
                          onClick={(event) => openEditModal(event, mentor)}
                        >
                          ✎ Таҳрир
                        </button>
                        <button
                          type="button"
                          className="management-delete-button"
                          onClick={(event) => handleDelete(event, mentor)}
                          disabled={deletingId === mentor.id}
                        >
                          {deletingId === mentor.id ? "…" : "×"}
                        </button>
                      </>
                    )}
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {canManage && (
        <ResourceModal
          open={modalOpen}
          title={editingMentor ? "Таҳрири омӯзгор" : "Профили омӯзгор"}
          description={
            editingMentor
              ? "Сана, суроға ва сатҳи омӯзгорро нав кунед."
              : "ID-и user-и мавҷуда ва маълумоти профилро ворид кунед."
          }
          submitLabel={editingMentor ? "Нав кардани профил" : "Сохтани профил"}
          loading={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        >
          <div className="resource-form-grid management-form-grid">
            {!editingMentor && (
              <label className="resource-field resource-field-full">
                <span>User ID</span>
                <input
                  type="number"
                  min="1"
                  name="user_id"
                  value={form.user_id}
                  onChange={handleChange}
                  required
                />
              </label>
            )}

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
              <span>Сатҳ</span>
              <select name="level" value={form.level} onChange={handleChange}>
                <option value="junior">Junior</option>
                <option value="middle">Middle</option>
                <option value="senior">Senior</option>
              </select>
            </label>

            <label className="resource-field resource-field-full">
              <span>Суроға</span>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                required
              />
            </label>
          </div>
        </ResourceModal>
      )}
    </MainLayout>
  );
}

export default MentorsPage;
