import { useEffect, useMemo, useState } from "react";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import ResourceModal from "../components/ui/ResourceModal";
import {
  ResourceAlert,
  ResourceEmpty,
  ResourceLoading,
} from "../components/ui/ResourceState";
import {
  displayUsername,
  extractApiError,
  formatDate,
  normalizeList,
} from "../utils/data";

import "../styles/resources.css";
import "../styles/management.css";

const initialForm = {
  mentor_id: "",
  group_id: "",
};

function MentorEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [enrollResponse, mentorResponse, groupResponse] = await Promise.all([
        api.get("/education/mentor-enrollments/"),
        api.get("/accounts/mentors/"),
        api.get("/education/groups/"),
      ]);
      setEnrollments(normalizeList(enrollResponse.data));
      setMentors(normalizeList(mentorResponse.data));
      setGroups(normalizeList(groupResponse.data));
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Маълумоти қабули омӯзгорон гирифта нашуд.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredEnrollments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return enrollments;

    return enrollments.filter((enrollment) =>
      [
        displayUsername(enrollment.mentor),
        enrollment.group?.title,
        enrollment.group?.course?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [enrollments, search]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreateModal() {
    setEditingEnrollment(null);
    setForm(initialForm);
    setModalOpen(true);
    setError("");
  }

  function openEditModal(enrollment) {
    setEditingEnrollment(enrollment);
    setForm({
      mentor_id: String(enrollment.mentor?.id || ""),
      group_id: String(enrollment.group?.id || ""),
    });
    setModalOpen(true);
    setError("");
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingEnrollment(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      mentor_id: Number(form.mentor_id),
      group_id: Number(form.group_id),
    };

    try {
      if (editingEnrollment) {
        await api.patch(
          `/education/mentor-enrollments/${editingEnrollment.id}/`,
          payload,
        );
        setSuccess("Пайвастшавии омӯзгор нав карда шуд.");
      } else {
        await api.post("/education/mentor-enrollments/", payload);
        setSuccess("Омӯзгор ба гурӯҳ пайваст шуд.");
      }

      closeModal();
      await loadData();
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          editingEnrollment
            ? "Пайвастшавӣ нав карда нашуд."
            : "Омӯзгор ба гурӯҳ пайваст нашуд.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(enrollment) {
    if (!window.confirm("Ин пайвастшавии омӯзгор ҳазф шавад?")) return;

    setDeletingId(enrollment.id);
    setError("");

    try {
      await api.delete(`/education/mentor-enrollments/${enrollment.id}/`);
      setSuccess("Пайвастшавии омӯзгор ҳазф шуд.");
      await loadData();
    } catch (requestError) {
      setError(
        extractApiError(requestError, "Пайвастшавии омӯзгор ҳазф нашуд."),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <MainLayout
      title="Қабули омӯзгор"
      description="Омӯзгоронро ба гурӯҳҳо пайваст ва пайвастшавиро таҳрир кунед."
    >
      <div className="resource-page management-page">
        <ResourceAlert type="error" onClose={() => setError("")}>
          {error}
        </ResourceAlert>
        <ResourceAlert type="success" onClose={() => setSuccess("")}>
          {success}
        </ResourceAlert>

        <section className="management-spotlight management-spotlight-orange">
          <div>
            <span className="management-eyebrow">MENTOR ASSIGNMENTS</span>
            <h2>Пайваст кардани омӯзгор ба гурӯҳ</h2>
            <p>
              Ҳар омӯзгорро ба гурӯҳи дуруст пайваст кунед ва дар ҳолати зарурӣ
              гурӯҳро иваз намоед.
            </p>
          </div>
          <div className="management-spotlight-metric">
            <strong>{enrollments.length}</strong>
            <span>assignment</span>
          </div>
        </section>

        <section className="resource-kpi-grid">
          <article className="resource-kpi-card">
            <span>Пайвастшавӣ</span>
            <strong>{enrollments.length}</strong>
            <small>ҳамагӣ</small>
          </article>
          <article className="resource-kpi-card">
            <span>Омӯзгорон</span>
            <strong>{mentors.length}</strong>
            <small>профил</small>
          </article>
          <article className="resource-kpi-card">
            <span>Гурӯҳҳо</span>
            <strong>{groups.length}</strong>
            <small>ҳамагӣ</small>
          </article>
        </section>

        <section className="resource-card management-resource-card">
          <header className="resource-toolbar">
            <div className="resource-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Омӯзгор, гурӯҳ ё курс..."
              />
            </div>
            <div className="resource-toolbar-actions">
              <button
                type="button"
                className="resource-button resource-button-ghost"
                onClick={loadData}
              >
                Аз нав гирифтан
              </button>
              <button
                type="button"
                className="resource-button resource-button-primary"
                onClick={openCreateModal}
              >
                + Қабули нав
              </button>
            </div>
          </header>

          {loading ? (
            <ResourceLoading />
          ) : filteredEnrollments.length === 0 ? (
            <ResourceEmpty
              title="Пайвастшавӣ нест"
              description="Омӯзгорро ба гурӯҳ пайваст кунед."
              actionLabel="Қабули нав"
              onAction={openCreateModal}
            />
          ) : (
            <div className="resource-table-wrapper">
              <table className="resource-table">
                <thead>
                  <tr>
                    <th>Омӯзгор</th>
                    <th>Сатҳ</th>
                    <th>Гурӯҳ</th>
                    <th>Курс</th>
                    <th>Сана</th>
                    <th>Амал</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>
                        <div className="resource-person">
                          <div className="resource-avatar resource-avatar-purple">
                            {displayUsername(enrollment.mentor)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <strong>{displayUsername(enrollment.mentor)}</strong>
                            <span>#{enrollment.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>{enrollment.mentor?.level || "—"}</td>
                      <td>{enrollment.group?.title || "—"}</td>
                      <td>{enrollment.group?.course?.title || "—"}</td>
                      <td>{formatDate(enrollment.created_at)}</td>
                      <td>
                        <div className="resource-row-actions">
                          <button
                            type="button"
                            className="management-edit-button"
                            onClick={() => openEditModal(enrollment)}
                          >
                            ✎ Таҳрир
                          </button>
                          <button
                            type="button"
                            className="management-delete-button"
                            onClick={() => handleDelete(enrollment)}
                            disabled={deletingId === enrollment.id}
                          >
                            {deletingId === enrollment.id ? "…" : "×"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ResourceModal
        open={modalOpen}
        title={editingEnrollment ? "Таҳрири қабули омӯзгор" : "Қабули омӯзгор"}
        description="Омӯзгор ва гурӯҳро интихоб кунед."
        submitLabel={editingEnrollment ? "Нав кардани қабул" : "Пайваст кардан"}
        loading={saving}
        onClose={closeModal}
        onSubmit={handleSubmit}
      >
        <div className="resource-form-grid management-form-grid">
          <label className="resource-field resource-field-full">
            <span>Омӯзгор</span>
            <select
              name="mentor_id"
              value={form.mentor_id}
              onChange={handleChange}
              required
            >
              <option value="">Интихоб кунед</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {displayUsername(mentor)} — {mentor.level}
                </option>
              ))}
            </select>
          </label>

          <label className="resource-field resource-field-full">
            <span>Гурӯҳ</span>
            <select
              name="group_id"
              value={form.group_id}
              onChange={handleChange}
              required
            >
              <option value="">Интихоб кунед</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title} — {group.course?.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </ResourceModal>
    </MainLayout>
  );
}

export default MentorEnrollmentsPage;
