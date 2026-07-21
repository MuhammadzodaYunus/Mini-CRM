import { useEffect, useMemo, useState } from "react";

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

const initialForm = {
  student_id: "",
  group_id: "",
  grade: "",
};

const gradeOptions = [1, 2, 3, 4, 5];

function GradesPage() {
  const { role } = useAuth();

  const canManage =
    role === "admin" || role === "mentor";

  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);

  const [form, setForm] = useState(initialForm);
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
      const requests = [
        api.get("/journal/grades/"),
      ];

      if (canManage) {
        requests.push(
          api.get("/accounts/students/"),
          api.get("/education/groups/"),
        );
      }

      const [
        gradesResponse,
        studentsResponse,
        groupsResponse,
      ] = await Promise.all(requests);

      setGrades(
        normalizeList(gradesResponse.data),
      );

      setStudents(
        normalizeList(studentsResponse?.data),
      );

      setGroups(
        normalizeList(groupsResponse?.data),
      );
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Баҳоҳо гирифта нашуданд.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [canManage]);

  const filteredGrades = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return grades;
    }

    return grades.filter((item) => {
      const searchableText = [
        displayUsername(item.student),
        item.group?.title,
        item.group?.course?.title,
        item.grade,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [grades, search]);

  const availableStudents = useMemo(() => {
    if (!form.group_id) {
      return [];
    }

    const selectedGroupId = Number(
      form.group_id,
    );

    return students.filter((student) => {
      return (
        Number(
          student.active_group?.group_id,
        ) === selectedGroupId
      );
    });
  }, [students, form.group_id]);

  const averageGrade = useMemo(() => {
    if (!grades.length) {
      return "0";
    }

    const total = grades.reduce(
      (sum, item) =>
        sum + Number(item.grade || 0),
      0,
    );

    return (
      total / grades.length
    ).toFixed(1);
  }, [grades]);

  const highestGrade = useMemo(() => {
    if (!grades.length) {
      return 0;
    }

    return Math.max(
      ...grades.map((item) =>
        Number(item.grade || 0),
      ),
    );
  }, [grades]);

  const excellentGradesCount = useMemo(() => {
    return grades.filter(
      (item) => Number(item.grade) === 5,
    ).length;
  }, [grades]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === "group_id") {
        return {
          ...current,
          group_id: value,
          student_id: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
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

    const grade = Number(form.grade);

    if (!gradeOptions.includes(grade)) {
      setError(
        "Баҳо бояд аз 1 то 5 бошад.",
      );
      return;
    }

    if (
      !form.group_id ||
      !form.student_id
    ) {
      setError(
        "Гурӯҳ ва донишҷӯро интихоб кунед.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post(
        "/journal/grades/",
        {
          student_id: Number(
            form.student_id,
          ),
          group_id: Number(
            form.group_id,
          ),
          grade,
        },
      );

      setSuccess(
        "Баҳо бомуваффақият сабт шуд.",
      );

      setModalOpen(false);
      setForm(initialForm);

      await loadData();
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Баҳо сабт нашуд.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Баҳои ${item.grade}-и ${displayUsername(
        item.student,
      )} ҳазф шавад?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/journal/grades/${item.id}/`,
      );

      setGrades((currentGrades) =>
        currentGrades.filter(
          (grade) => grade.id !== item.id,
        ),
      );

      setSuccess(
        "Баҳо бомуваффақият ҳазф шуд.",
      );
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Баҳо ҳазф нашуд.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <MainLayout
      title="Баҳоҳо"
      description="Баҳои донишҷӯёнро аз 1 то 5 бинед ва сабт намоед."
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

        <section className="resource-kpi-grid">
          <article className="resource-kpi-card">
            <span>Ҳамаи баҳоҳо</span>

            <strong>
              {grades.length}
            </strong>

            <small>ҳамагӣ</small>
          </article>

          <article className="resource-kpi-card">
            <span>Баҳои миёна</span>

            <strong>
              {averageGrade}
            </strong>

            <small>аз 5</small>
          </article>

          <article className="resource-kpi-card">
            <span>Баҳои баланд</span>

            <strong>
              {highestGrade}
            </strong>

            <small>maximum</small>
          </article>

          <article className="resource-kpi-card">
            <span>Баҳои аъло</span>

            <strong>
              {excellentGradesCount}
            </strong>

            <small>баҳои 5</small>
          </article>
        </section>

        <section className="resource-card">
          <header className="resource-toolbar">
            <div className="resource-search">
              <span>⌕</span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Донишҷӯ, гурӯҳ ё баҳо..."
              />
            </div>

            <div className="resource-toolbar-actions">
              <button
                type="button"
                className="resource-button resource-button-ghost"
                onClick={loadData}
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
                  + Баҳои нав
                </button>
              )}
            </div>
          </header>

          {loading ? (
            <ResourceLoading />
          ) : filteredGrades.length === 0 ? (
            <ResourceEmpty
              title="Баҳо нест"
              description="Ҳоло ягон баҳо сабт нашудааст."
              actionLabel={
                canManage
                  ? "Баҳои нав"
                  : undefined
              }
              onAction={
                canManage
                  ? openCreateModal
                  : undefined
              }
            />
          ) : (
            <div className="resource-table-wrapper">
              <table className="resource-table">
                <thead>
                  <tr>
                    <th>Донишҷӯ</th>
                    <th>Гурӯҳ</th>
                    <th>Курс</th>
                    <th>Баҳо</th>
                    <th>Сана</th>

                    {canManage && (
                      <th aria-label="Амал" />
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredGrades.map(
                    (item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="resource-person">
                            <div className="resource-avatar">
                              {displayUsername(
                                item.student,
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {displayUsername(
                                  item.student,
                                )}
                              </strong>

                              <span>
                                Grade #{item.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {item.group?.title ||
                            "—"}
                        </td>

                        <td>
                          {item.group?.course
                            ?.title || "—"}
                        </td>

                        <td>
                          <span className="grade-score-badge">
                            {item.grade} / 5
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            item.created_at,
                          )}
                        </td>

                        {canManage && (
                          <td>
                            <button
                              type="button"
                              className="resource-icon-button resource-icon-button-danger"
                              onClick={() =>
                                handleDelete(item)
                              }
                              disabled={
                                deletingId ===
                                item.id
                              }
                              title="Ҳазф кардани баҳо"
                            >
                              {deletingId ===
                              item.id
                                ? "…"
                                : "×"}
                            </button>
                          </td>
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {canManage && (
        <ResourceModal
          open={modalOpen}
          title="Баҳои нав"
          description="Аввал гурӯҳ, баъд донишҷӯи фаъоли он гурӯҳ ва баҳои 1–5-ро интихоб кунед."
          loading={saving}
          onClose={closeCreateModal}
          onSubmit={handleSubmit}
        >
          <div className="resource-form-grid">
            <label className="resource-field resource-field-full">
              <span>Гурӯҳ</span>

              <select
                name="group_id"
                value={form.group_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Интихоб кунед
                </option>

                {groups.map((group) => (
                  <option
                    key={group.id}
                    value={group.id}
                  >
                    {group.title}
                    {" — "}
                    {group.course?.title ||
                      "Курс нест"}
                  </option>
                ))}
              </select>
            </label>

            <label className="resource-field resource-field-full">
              <span>Донишҷӯ</span>

              <select
                name="student_id"
                value={form.student_id}
                onChange={handleChange}
                disabled={!form.group_id}
                required
              >
                <option value="">
                  {!form.group_id
                    ? "Аввал гурӯҳро интихоб кунед"
                    : "Донишҷӯро интихоб кунед"}
                </option>

                {availableStudents.map(
                  (student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {displayUsername(
                        student,
                      )}
                    </option>
                  ),
                )}
              </select>

              {form.group_id &&
                availableStudents.length === 0 && (
                  <small>
                    Дар ин гурӯҳ донишҷӯи
                    фаъол вуҷуд надорад.
                  </small>
                )}
            </label>

            <label className="resource-field resource-field-full">
              <span>Баҳо</span>

              <select
                name="grade"
                value={form.grade}
                onChange={handleChange}
                required
              >
                <option value="">
                  Баҳои 1–5-ро интихоб кунед
                </option>

                {gradeOptions.map(
                  (grade) => (
                    <option
                      key={grade}
                      value={grade}
                    >
                      {grade}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
        </ResourceModal>
      )}
    </MainLayout>
  );
}

export default GradesPage;