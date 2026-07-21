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
import { extractApiError, normalizeList } from "../utils/data";

import "../styles/resources.css";
import "../styles/management.css";

const initialForm = {
  title: "",
  description: "",
  price: "",
};

function CoursesPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const canManage = role === "admin";

  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingCourse, setEditingCourse] = useState(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCourses() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/education/courses/");
      setCourses(normalizeList(response.data));
    } catch (requestError) {
      setError(
        extractApiError(requestError, "Рӯйхати курсҳо гирифта нашуд."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return courses;

    return courses.filter((course) =>
      [course.id, course.title, course.description, course.price]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [courses, search]);

  const totalValue = courses.reduce(
    (sum, course) => sum + Number(course.price || 0),
    0,
  );
  const totalGroups = courses.reduce(
    (sum, course) =>
      sum + Number(course.groups_count ?? course.groups?.length ?? 0),
    0,
  );
  const activeGroups = courses.reduce(
    (sum, course) => sum + Number(course.active_groups_count || 0),
    0,
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreateModal() {
    setEditingCourse(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(event, course) {
    event.stopPropagation();
    setEditingCourse(course);
    setForm({
      title: course.title || "",
      description: course.description || "",
      price: course.price || "",
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingCourse(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
    };

    try {
      if (editingCourse) {
        await api.patch(`/education/courses/${editingCourse.id}/`, payload);
        setSuccess("Курс бомуваффақият нав карда шуд.");
      } else {
        await api.post("/education/courses/", payload);
        setSuccess("Курс бомуваффақият сохта шуд.");
      }

      closeModal();
      await loadCourses();
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          editingCourse ? "Курс нав карда нашуд." : "Курс сохта нашуд.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event, course) {
    event.stopPropagation();
    if (!window.confirm(`Курси «${course.title}» ҳазф шавад?`)) return;

    setDeletingId(course.id);
    setError("");

    try {
      await api.delete(`/education/courses/${course.id}/`);
      setCourses((items) => items.filter((item) => item.id !== course.id));
      setSuccess("Курс ҳазф шуд.");
    } catch (requestError) {
      setError(extractApiError(requestError, "Курс ҳазф нашуд."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <MainLayout
      title="Курсҳо"
      description="Курсҳои таълимӣ, гурӯҳҳо, нарх ва тавсифро идора кунед."
    >
      <div className="resource-page management-page">
        <ResourceAlert type="error" onClose={() => setError("")}>
          {error}
        </ResourceAlert>
        <ResourceAlert type="success" onClose={() => setSuccess("")}>
          {success}
        </ResourceAlert>

        <section className="management-spotlight management-spotlight-blue">
          <div>
            <span className="management-eyebrow">COURSE CATALOG</span>
            <h2>Маркази идоракунии курсҳо</h2>
            <p>
              Аз ҳамин саҳифа курс созед, маълумотро таҳрир кунед ва гурӯҳҳои
              вобастаро кушоед.
            </p>
          </div>
          <div className="management-spotlight-metric">
            <strong>{courses.length}</strong>
            <span>курс</span>
          </div>
        </section>

        <section className="resource-kpi-grid resource-kpi-grid-four">
          <article className="resource-kpi-card">
            <span>Курсҳо</span>
            <strong>{courses.length}</strong>
            <small>ҳамагӣ</small>
          </article>
          <article className="resource-kpi-card">
            <span>Гурӯҳҳо</span>
            <strong>{totalGroups}</strong>
            <small>ҳамагӣ</small>
          </article>
          <article className="resource-kpi-card">
            <span>Гурӯҳҳои фаъол</span>
            <strong>{activeGroups}</strong>
            <small>active</small>
          </article>
          <article className="resource-kpi-card">
            <span>Арзиши умумӣ</span>
            <strong>{totalValue.toLocaleString()}</strong>
            <small>сомонӣ</small>
          </article>
        </section>

        <section className="resource-card management-resource-card">
          <header className="resource-toolbar">
            <div className="resource-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Курсро ҷустуҷӯ кунед..."
              />
            </div>

            <div className="resource-toolbar-actions">
              <button
                type="button"
                className="resource-button resource-button-ghost"
                onClick={loadCourses}
              >
                Аз нав гирифтан
              </button>
              {canManage && (
                <button
                  type="button"
                  className="resource-button resource-button-primary"
                  onClick={openCreateModal}
                >
                  + Курси нав
                </button>
              )}
            </div>
          </header>

          {loading ? (
            <ResourceLoading />
          ) : filteredCourses.length === 0 ? (
            <ResourceEmpty
              title="Курс ёфт нашуд"
              description="Ҷустуҷӯро тағйир диҳед ё курси нав созед."
              actionLabel={canManage ? "Курси нав" : undefined}
              onAction={canManage ? openCreateModal : undefined}
            />
          ) : (
            <div className="management-course-grid">
              {filteredCourses.map((course) => (
                <article
                  className="management-course-card"
                  key={course.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") navigate(`/courses/${course.id}`);
                  }}
                >
                  <header>
                    <div className="management-course-icon">▤</div>
                    <span className="management-id-label">
                      COURSE #{String(course.id).padStart(3, "0")}
                    </span>
                  </header>

                  <h3>{course.title}</h3>
                  <p>{course.description || "Тавсиф вуҷуд надорад."}</p>

                  <div className="management-course-stats">
                    <div>
                      <span>Нарх</span>
                      <strong>
                        {Number(course.price || 0).toLocaleString()} сомонӣ
                      </strong>
                    </div>
                    <div>
                      <span>Гурӯҳҳо</span>
                      <strong>{course.groups_count ?? course.groups?.length ?? 0}</strong>
                    </div>
                  </div>

                  <footer className="management-card-actions">
                    <button
                      type="button"
                      className="management-view-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/courses/${course.id}`);
                      }}
                    >
                      Дидани detail →
                    </button>

                    {canManage && (
                      <>
                        <button
                          type="button"
                          className="management-edit-button"
                          onClick={(event) => openEditModal(event, course)}
                        >
                          ✎ Таҳрир
                        </button>
                        <button
                          type="button"
                          className="management-delete-button"
                          onClick={(event) => handleDelete(event, course)}
                          disabled={deletingId === course.id}
                        >
                          {deletingId === course.id ? "…" : "×"}
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
          title={editingCourse ? "Таҳрири курс" : "Курси нав"}
          description="Ном, тавсиф ва нархи курсро ворид кунед."
          submitLabel={editingCourse ? "Нав кардани курс" : "Сохтани курс"}
          loading={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        >
          <div className="resource-form-grid management-form-grid">
            <label className="resource-field resource-field-full">
              <span>Номи курс</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="resource-field resource-field-full">
              <span>Тавсиф</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="5"
                required
              />
            </label>

            <label className="resource-field resource-field-full">
              <span>Нарх</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                name="price"
                value={form.price}
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

export default CoursesPage;
