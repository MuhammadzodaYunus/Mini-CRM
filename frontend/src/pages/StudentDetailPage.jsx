import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import ResourceModal from "../components/ui/ResourceModal";
import {
  ResourceAlert,
  ResourceLoading,
} from "../components/ui/ResourceState";
import { useAuth } from "../context/AuthContext";
import {
  extractApiError,
  formatDate,
} from "../utils/data";

import "../styles/detail.css";
import "../styles/student-detail.css";

function getFullName(user) {
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user?.username || "Донишҷӯ";
}

function getInitials(user) {
  const source = getFullName(user).trim();

  if (!source) {
    return "ST";
  }

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function calculateAge(birthDate) {
  if (!birthDate) {
    return "—";
  }

  const birth = new Date(birthDate);

  if (Number.isNaN(birth.getTime())) {
    return "—";
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : "—";
}

function statusLabel(status) {
  if (status === "active") {
    return "Фаъол";
  }

  if (status === "finished") {
    return "Анҷомшуда";
  }

  return status || "Номаълум";
}

function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const canManage = role === "admin";

  const [student, setStudent] = useState(null);
  const [form, setForm] = useState({
    birth_date: "",
    address: "",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadStudent() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/accounts/students/${id}/`,
      );

      setStudent(response.data);
    } catch (requestError) {
      setStudent(null);
      setError(
        extractApiError(
          requestError,
          "Маълумоти донишҷӯ гирифта нашуд.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudent();
  }, [id]);

  const educationHistory = useMemo(() => {
    const items = Array.isArray(student?.education_history)
      ? [...student.education_history]
      : [];

    return items.sort((first, second) => {
      const firstDate = new Date(
        first.created_at || first.group_start_date || 0,
      ).getTime();
      const secondDate = new Date(
        second.created_at || second.group_start_date || 0,
      ).getTime();

      return secondDate - firstDate;
    });
  }, [student]);

  function openEditModal() {
    setForm({
      birth_date: student?.birth_date || "",
      address: student?.address || "",
    });
    setError("");
    setSuccess("");
    setEditOpen(true);
  }

  function closeEditModal() {
    if (saving) {
      return;
    }

    setEditOpen(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleUpdate(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `/accounts/students/${id}/`,
        {
          birth_date: form.birth_date,
          address: form.address.trim(),
        },
      );

      setStudent(response.data);
      setSuccess("Маълумоти донишҷӯ нав карда шуд.");
      setEditOpen(false);
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Маълумоти донишҷӯ нав карда нашуд.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <MainLayout
        title="Маълумоти донишҷӯ"
        description="Профили донишҷӯ гирифта шуда истодааст."
      >
        <ResourceLoading label="Маълумоти донишҷӯ бор шуда истодааст..." />
      </MainLayout>
    );
  }

  if (!student) {
    return (
      <MainLayout
        title="Донишҷӯ ёфт нашуд"
        description="Маълумоти ин донишҷӯ дастрас нест."
      >
        <div className="detail-page">
          <ResourceAlert type="error">
            {error || "Донишҷӯ вуҷуд надорад."}
          </ResourceAlert>

          <button
            type="button"
            className="detail-back-button"
            onClick={() => navigate("/students")}
          >
            ← Бозгашт ба донишҷӯён
          </button>
        </div>
      </MainLayout>
    );
  }

  const user = student.user || {};
  const fullName = getFullName(user);
  const activeGroup = student.active_group;
  const activeHistoryCount = educationHistory.filter(
    (item) => item.status === "active",
  ).length;
  const finishedHistoryCount = educationHistory.filter(
    (item) => item.status === "finished",
  ).length;

  return (
    <MainLayout
      title={fullName}
      description="Профил, гурӯҳи фаъол ва таърихи таҳсили донишҷӯ."
    >
      <div className="detail-page">
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

        <div className="detail-top-actions">
          <button
            type="button"
            className="detail-back-button"
            onClick={() => navigate("/students")}
          >
            ← Бозгашт ба донишҷӯён
          </button>

          <div className="student-detail-actions">
            <button
              type="button"
              className="detail-refresh-button"
              onClick={loadStudent}
            >
              Навсозӣ
            </button>

            {canManage && (
              <button
                type="button"
                className="student-detail-edit-button"
                onClick={openEditModal}
              >
                Таҳрири профил
              </button>
            )}
          </div>
        </div>

        <section className="student-detail-hero">
          <div className="student-detail-identity">
            <div className="student-detail-avatar">
              {getInitials(user)}
            </div>

            <div className="student-detail-identity-copy">
              <div className="student-detail-topline">
                <span>
                  STUDENT #{String(student.id).padStart(3, "0")}
                </span>

                <b>
                  {activeGroup ? "Донишҷӯи фаъол" : "Бе гурӯҳи фаъол"}
                </b>
              </div>

              <h2>{fullName}</h2>

              <p>@{user.username || "username нест"}</p>

              <div className="student-detail-contact-row">
                <span>{user.phone_number || "Телефон нест"}</span>
                <span>{user.email || "Email нест"}</span>
                <span>{student.address || "Суроға нест"}</span>
              </div>
            </div>
          </div>

          <div className="student-detail-hero-card">
            <span>Гурӯҳи ҳозира</span>

            <strong>
              {activeGroup?.group_title || "Гурӯҳи фаъол нест"}
            </strong>

            <small>
              {activeGroup?.course_title ||
                "Донишҷӯ ҳоло ба гурӯҳ пайваст нест."}
            </small>

            {activeGroup?.group_id && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/groups/${activeGroup.group_id}`)
                }
              >
                Дидани гурӯҳ →
              </button>
            )}
          </div>
        </section>

        <section className="student-detail-stat-grid">
          <article className="student-detail-stat-card">
            <span>Синну сол</span>
            <strong>{calculateAge(student.birth_date)}</strong>
            <small>сол</small>
          </article>

          <article className="student-detail-stat-card">
            <span>Таърихи таҳсил</span>
            <strong>{educationHistory.length}</strong>
            <small>enrollment</small>
          </article>

          <article className="student-detail-stat-card">
            <span>Фаъол</span>
            <strong>{activeHistoryCount}</strong>
            <small>гурӯҳ</small>
          </article>

          <article className="student-detail-stat-card">
            <span>Анҷомшуда</span>
            <strong>{finishedHistoryCount}</strong>
            <small>курс</small>
          </article>
        </section>

        <div className="student-detail-main-grid">
          <section className="student-detail-section">
            <header className="student-detail-section-header">
              <div>
                <span>PERSONAL INFO</span>
                <h3>Маълумоти шахсӣ</h3>
              </div>
            </header>

            <dl className="student-detail-info-list">
              <div>
                <dt>Номи корбар</dt>
                <dd>@{user.username || "—"}</dd>
              </div>

              <div>
                <dt>Ном</dt>
                <dd>{user.first_name || "—"}</dd>
              </div>

              <div>
                <dt>Насаб</dt>
                <dd>{user.last_name || "—"}</dd>
              </div>

              <div>
                <dt>Телефон</dt>
                <dd>{user.phone_number || "—"}</dd>
              </div>

              <div>
                <dt>Email</dt>
                <dd>{user.email || "—"}</dd>
              </div>

              <div>
                <dt>Санаи таваллуд</dt>
                <dd>{formatDate(student.birth_date)}</dd>
              </div>

              <div>
                <dt>Суроға</dt>
                <dd>{student.address || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="student-detail-section student-detail-active-section">
            <header className="student-detail-section-header">
              <div>
                <span>ACTIVE EDUCATION</span>
                <h3>Таҳсили ҳозира</h3>
              </div>

              {activeGroup && (
                <b className="student-detail-active-badge">
                  {statusLabel(activeGroup.enrollment_status)}
                </b>
              )}
            </header>

            {!activeGroup ? (
              <div className="student-detail-empty-small">
                <div>◇</div>
                <strong>Гурӯҳи фаъол нест</strong>
                <p>
                  Барои ин донишҷӯ ҳоло enrollment-и фаъол
                  вуҷуд надорад.
                </p>
              </div>
            ) : (
              <div className="student-detail-active-card">
                <span>
                  ENROLLMENT #{String(
                    activeGroup.enrollment_id,
                  ).padStart(3, "0")}
                </span>

                <h4>{activeGroup.course_title}</h4>

                <p>{activeGroup.group_title}</p>

                <dl>
                  <div>
                    <dt>Филиал</dt>
                    <dd>{activeGroup.branch || "—"}</dd>
                  </div>

                  <div>
                    <dt>Ҳолати гурӯҳ</dt>
                    <dd>{statusLabel(activeGroup.group_status)}</dd>
                  </div>

                  <div>
                    <dt>Нархи курс</dt>
                    <dd>
                      {Number(
                        activeGroup.course_price || 0,
                      ).toLocaleString()} сомонӣ
                    </dd>
                  </div>
                </dl>

                <div className="student-detail-active-buttons">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/groups/${activeGroup.group_id}`)
                    }
                  >
                    Дидани гурӯҳ
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/courses/${activeGroup.course_id}`)
                    }
                  >
                    Дидани курс
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="student-detail-section">
          <header className="student-detail-section-header student-detail-history-header">
            <div>
              <span>EDUCATION HISTORY</span>
              <h3>Таърихи таҳсил</h3>
              <p>
                Ҳамаи гурӯҳҳо ва курсҳое, ки донишҷӯ дар онҳо
                сабт шудааст.
              </p>
            </div>

            <b className="student-detail-count-badge">
              {educationHistory.length} сабт
            </b>
          </header>

          {educationHistory.length === 0 ? (
            <div className="student-detail-empty-history">
              <div>▣</div>
              <strong>Таърихи таҳсил вуҷуд надорад</strong>
              <p>
                Ин донишҷӯ ҳоло ба ягон гурӯҳ сабт нашудааст.
              </p>
            </div>
          ) : (
            <div className="student-detail-history-grid">
              {educationHistory.map((item, index) => (
                <article
                  className="student-detail-history-card"
                  key={item.enrollment_id}
                >
                  <header>
                    <span>
                      #{String(index + 1).padStart(2, "0")}
                    </span>

                    <b
                      className={`student-detail-history-status student-detail-history-status-${item.status}`}
                    >
                      {statusLabel(item.status)}
                    </b>
                  </header>

                  <small>
                    ENROLLMENT #{String(
                      item.enrollment_id,
                    ).padStart(3, "0")}
                  </small>

                  <h4>{item.course_title}</h4>
                  <p>{item.group_title}</p>

                  <dl>
                    <div>
                      <dt>Филиал</dt>
                      <dd>{item.branch || "—"}</dd>
                    </div>

                    <div>
                      <dt>Оғоз</dt>
                      <dd>{formatDate(item.group_start_date)}</dd>
                    </div>

                    <div>
                      <dt>Анҷом</dt>
                      <dd>{formatDate(item.group_end_date)}</dd>
                    </div>

                    <div>
                      <dt>Нарх</dt>
                      <dd>
                        {Number(
                          item.course_price || 0,
                        ).toLocaleString()} сомонӣ
                      </dd>
                    </div>
                  </dl>

                  <div className="student-detail-history-actions">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/groups/${item.group_id}`)
                      }
                    >
                      Гурӯҳ
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/courses/${item.course_id}`)
                      }
                    >
                      Курс
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {canManage && (
        <ResourceModal
          open={editOpen}
          title="Таҳрири донишҷӯ"
          description="Санаи таваллуд ва суроғаи донишҷӯро нав кунед."
          submitLabel="Нав кардан"
          loading={saving}
          onClose={closeEditModal}
          onSubmit={handleUpdate}
        >
          <div className="resource-form-grid">
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

export default StudentDetailPage;
