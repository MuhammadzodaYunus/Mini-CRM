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
import "../styles/student-detail.css";

const initialForm = {
  user_id: "",
  birth_date: "",
  address: "",
};

function getFullName(student) {
  const fullName = [
    student.user?.first_name,
    student.user?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || displayUsername(student);
}

function StudentsPage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const canManage = role === "admin";

  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/accounts/students/");
      setStudents(normalizeList(response.data));
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Рӯйхати донишҷӯён гирифта нашуд.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const hasActiveGroup = Boolean(student.active_group);

      if (groupFilter === "active" && !hasActiveGroup) {
        return false;
      }

      if (groupFilter === "without" && hasActiveGroup) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        student.id,
        getFullName(student),
        student.user?.username,
        student.user?.email,
        student.user?.phone_number,
        student.address,
        student.birth_date,
        student.active_group?.course_title,
        student.active_group?.group_title,
        student.active_group?.branch,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [students, search, groupFilter]);

  const activeStudentsCount = students.filter(
    (student) => Boolean(student.active_group),
  ).length;

  const withoutGroupCount =
    students.length - activeStudentsCount;

  const uniqueCoursesCount = new Set(
    students
      .map((student) => student.active_group?.course_id)
      .filter(Boolean),
  ).size;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function openCreateModal() {
    setForm(initialForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeCreateModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/accounts/students/", {
        user_id: Number(form.user_id),
        birth_date: form.birth_date,
        address: form.address.trim(),
      });

      setSuccess("Профили донишҷӯ сохта шуд.");
      setModalOpen(false);
      setForm(initialForm);

      await loadStudents();
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Профили донишҷӯ сохта нашуд.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event, student) {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Донишҷӯи «${getFullName(student)}» ҳазф шавад?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(student.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/accounts/students/${student.id}/`);

      setStudents((currentStudents) =>
        currentStudents.filter(
          (item) => item.id !== student.id,
        ),
      );

      setSuccess("Профили донишҷӯ ҳазф шуд.");
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Профили донишҷӯ ҳазф нашуд.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  function openStudent(studentId) {
    navigate(`/students/${studentId}`);
  }

  function handleRowKeyDown(event, studentId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openStudent(studentId);
    }
  }

  return (
    <MainLayout
      title="Донишҷӯён"
      description="Профил, гурӯҳи фаъол ва таърихи таҳсили ҳар донишҷӯро бинед."
    >
      <div className="resource-page">
        <ResourceAlert
          type="error"
          onClose={() => setError("")}
        >
          {error}
        </ResourceAlert>

        <ResourceAlert
          type="success"
          onClose={() => setSuccess("")}
        >
          {success}
        </ResourceAlert>

        <section className="resource-hero student-list-hero">
          <div className="resource-hero-copy">
            <span className="resource-hero-label">
              STUDENT DIRECTORY
            </span>

            <h2>Феҳристи донишҷӯён</h2>

            <p>
              Донишҷӯро кушоед, гурӯҳи фаъол, курс,
              маълумоти шахсӣ ва тамоми таърихи таҳсилашро
              бинед.
            </p>
          </div>

          <div className="resource-hero-metric">
            <span>Ҳамагӣ</span>
            <strong>{students.length}</strong>
            <small>донишҷӯ</small>
          </div>
        </section>

        <section className="resource-kpi-grid resource-kpi-grid-four">
          <article className="resource-kpi-card">
            <span>Ҳамаи донишҷӯён</span>
            <strong>{students.length}</strong>
            <small>профил</small>
          </article>

          <article className="resource-kpi-card">
            <span>Дар гурӯҳи фаъол</span>
            <strong>{activeStudentsCount}</strong>
            <small>донишҷӯ</small>
          </article>

          <article className="resource-kpi-card">
            <span>Бе гурӯҳ</span>
            <strong>{withoutGroupCount}</strong>
            <small>донишҷӯ</small>
          </article>

          <article className="resource-kpi-card">
            <span>Курсҳои фаъол</span>
            <strong>{uniqueCoursesCount}</strong>
            <small>курс</small>
          </article>
        </section>

        <section className="resource-card">
          <header className="resource-toolbar">
            <div className="resource-search">
              <span>⌕</span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Ном, телефон, курс ё гурӯҳ..."
              />
            </div>

            <div className="resource-toolbar-actions">
              <select
                className="resource-select-compact"
                value={groupFilter}
                onChange={(event) =>
                  setGroupFilter(event.target.value)
                }
              >
                <option value="all">Ҳамаи донишҷӯён</option>
                <option value="active">Дар гурӯҳи фаъол</option>
                <option value="without">Бе гурӯҳи фаъол</option>
              </select>

              <button
                type="button"
                className="resource-button resource-button-ghost"
                onClick={loadStudents}
                disabled={loading}
              >
                Навсозӣ
              </button>

              {canManage && (
                <button
                  type="button"
                  className="resource-button resource-button-primary"
                  onClick={openCreateModal}
                >
                  + Донишҷӯи нав
                </button>
              )}
            </div>
          </header>

          {loading ? (
            <ResourceLoading />
          ) : filteredStudents.length === 0 ? (
            <ResourceEmpty
              title="Донишҷӯ ёфт нашуд"
              description={
                canManage
                  ? "Ҷустуҷӯро тағйир диҳед ё профили нав созед."
                  : "Ҳоло ягон донишҷӯ барои нишон додан вуҷуд надорад."
              }
              actionLabel={canManage ? "Донишҷӯи нав" : undefined}
              onAction={canManage ? openCreateModal : undefined}
            />
          ) : (
            <div className="resource-table-wrapper">
              <table className="resource-table student-list-table">
                <thead>
                  <tr>
                    <th>Донишҷӯ</th>
                    <th>Курс</th>
                    <th>Гурӯҳи фаъол</th>
                    <th>Телефон</th>
                    <th>Таваллуд</th>
                    <th>Ҳолат</th>
                    <th>Амал</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="student-list-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => openStudent(student.id)}
                      onKeyDown={(event) =>
                        handleRowKeyDown(event, student.id)
                      }
                    >
                      <td>
                        <div className="resource-person">
                          <div className="resource-avatar">
                            {getFullName(student)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{getFullName(student)}</strong>
                            <span>
                              @{student.user?.username || "—"} · #
                              {String(student.id).padStart(3, "0")}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong className="student-list-course">
                          {student.active_group?.course_title || "—"}
                        </strong>
                      </td>

                      <td>
                        {student.active_group ? (
                          <div className="student-list-group-cell">
                            <strong>
                              {student.active_group.group_title}
                            </strong>
                            <span>
                              {student.active_group.branch || "—"}
                            </span>
                          </div>
                        ) : (
                          <span className="student-list-no-group">
                            Гурӯҳ нест
                          </span>
                        )}
                      </td>

                      <td>
                        {student.user?.phone_number || "—"}
                      </td>

                      <td>{formatDate(student.birth_date)}</td>

                      <td>
                        <span
                          className={`resource-badge ${
                            student.active_group
                              ? "resource-badge-success"
                              : "resource-badge-muted"
                          }`}
                        >
                          {student.active_group ? "Active" : "No group"}
                        </span>
                      </td>

                      <td>
                        <div className="student-list-actions">
                          <button
                            type="button"
                            className="student-list-view-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openStudent(student.id);
                            }}
                          >
                            Дидан →
                          </button>

                          {canManage && (
                            <button
                              type="button"
                              className="resource-icon-button resource-icon-button-danger"
                              onClick={(event) =>
                                handleDelete(event, student)
                              }
                              disabled={deletingId === student.id}
                              title="Ҳазф кардани донишҷӯ"
                            >
                              {deletingId === student.id ? "…" : "×"}
                            </button>
                          )}
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

      {canManage && (
        <ResourceModal
          open={modalOpen}
          title="Донишҷӯи нав"
          description="Профили Student-ро ба CustomUser-и мавҷуда пайваст кунед."
          loading={saving}
          onClose={closeCreateModal}
          onSubmit={handleSubmit}
        >
          <div className="resource-form-grid">
            <label className="resource-field resource-field-full">
              <span>User ID</span>

              <input
                type="number"
                min="1"
                name="user_id"
                value={form.user_id}
                onChange={handleChange}
                placeholder="Масалан: 4"
                required
              />

              <small>ID-и CustomUser аз Django Admin</small>
            </label>

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
                placeholder="Шаҳр ё ноҳия"
                required
              />
            </label>
          </div>
        </ResourceModal>
      )}
    </MainLayout>
  );
}

export default StudentsPage;
