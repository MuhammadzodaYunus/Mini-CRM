import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import {
  ResourceAlert,
  ResourceLoading,
} from "../components/ui/ResourceState";
import {
  displayUsername,
  extractApiError,
  formatDate,
} from "../utils/data";

import "../styles/mentor-detail.css";

const levelLabels = {
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
};

function getFullName(mentor) {
  const firstName = mentor?.user?.first_name?.trim();
  const lastName = mentor?.user?.last_name?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return fullName || displayUsername(mentor);
}

function getInitials(mentor) {
  const value = getFullName(mentor).trim();

  if (!value) {
    return "M";
  }

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function MentorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMentor() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/accounts/mentors/${id}/`);
      setMentor(response.data);
    } catch (requestError) {
      setMentor(null);
      setError(
        extractApiError(
          requestError,
          "Маълумоти омӯзгор гирифта нашуд.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMentor();
  }, [id]);

  const groups = useMemo(() => {
    return Array.isArray(mentor?.groups) ? mentor.groups : [];
  }, [mentor]);

  const activeGroupsCount = useMemo(() => {
    return groups.filter((group) => group.group_status === "active").length;
  }, [groups]);

  const coursesCount = useMemo(() => {
    return new Set(
      groups
        .map((group) => group.course_id)
        .filter((courseId) => courseId !== null && courseId !== undefined),
    ).size;
  }, [groups]);

  if (loading) {
    return (
      <MainLayout
        title="Маълумоти омӯзгор"
        description="Маълумоти омӯзгор гирифта шуда истодааст."
      >
        <ResourceLoading label="Маълумоти омӯзгор бор шуда истодааст..." />
      </MainLayout>
    );
  }

  if (!mentor) {
    return (
      <MainLayout
        title="Омӯзгор ёфт нашуд"
        description="Маълумоти ин омӯзгор дастрас нест."
      >
        <div className="mentor-detail-page">
          <ResourceAlert type="error">
            {error || "Омӯзгор вуҷуд надорад."}
          </ResourceAlert>

          <button
            type="button"
            className="mentor-detail-back-button"
            onClick={() => navigate("/mentors")}
          >
            ← Бозгашт ба омӯзгорон
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={getFullName(mentor)}
      description="Профил, сатҳ, гурӯҳҳо ва курсҳои омӯзгор."
    >
      <div className="mentor-detail-page">
        <ResourceAlert
          type="error"
          onClose={() => setError("")}
        >
          {error}
        </ResourceAlert>

        <div className="mentor-detail-actions">
          <button
            type="button"
            className="mentor-detail-back-button"
            onClick={() => navigate("/mentors")}
          >
            ← Бозгашт ба омӯзгорон
          </button>

          <button
            type="button"
            className="mentor-detail-refresh-button"
            onClick={loadMentor}
          >
            Навсозӣ
          </button>
        </div>

        <section className="mentor-detail-hero">
          <div className="mentor-detail-avatar">
            {getInitials(mentor)}
          </div>

          <div className="mentor-detail-hero-copy">
            <div className="mentor-detail-topline">
              <span>
                MENTOR #{String(mentor.id).padStart(3, "0")}
              </span>

              <strong className={`mentor-detail-level mentor-detail-level-${mentor.level}`}>
                {levelLabels[mentor.level] || mentor.level || "—"}
              </strong>
            </div>

            <h2>{getFullName(mentor)}</h2>

            <p>@{mentor.user?.username || "—"}</p>

            <div className="mentor-detail-contact-grid">
              <div>
                <span>Телефон</span>
                <strong>{mentor.user?.phone_number || "—"}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{mentor.user?.email || "—"}</strong>
              </div>

              <div>
                <span>Санаи таваллуд</span>
                <strong>{formatDate(mentor.birth_date)}</strong>
              </div>

              <div>
                <span>Суроға</span>
                <strong>{mentor.address || "—"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="mentor-detail-stats">
          <article>
            <span>Ҳамаи гурӯҳҳо</span>
            <strong>{groups.length}</strong>
            <small>гурӯҳ</small>
          </article>

          <article>
            <span>Гурӯҳҳои фаъол</span>
            <strong>{activeGroupsCount}</strong>
            <small>active</small>
          </article>

          <article>
            <span>Курсҳо</span>
            <strong>{coursesCount}</strong>
            <small>курс</small>
          </article>

          <article>
            <span>Сатҳи омӯзгор</span>
            <strong className="mentor-detail-level-text">
              {levelLabels[mentor.level] || mentor.level || "—"}
            </strong>
            <small>level</small>
          </article>
        </section>

        <section className="mentor-detail-section">
          <header className="mentor-detail-section-header">
            <div>
              <span>ASSIGNED GROUPS</span>
              <h3>Гурӯҳҳои омӯзгор</h3>
              <p>
                Гурӯҳ, курс, филиал ва муҳлати таҳсиле, ки омӯзгор ба он пайваст аст.
              </p>
            </div>

            <strong>{groups.length} гурӯҳ</strong>
          </header>

          {groups.length === 0 ? (
            <div className="mentor-detail-empty">
              <div>◆</div>
              <strong>Гурӯҳ вуҷуд надорад</strong>
              <p>Ин омӯзгор ҳоло ба ягон гурӯҳ пайваст нашудааст.</p>
            </div>
          ) : (
            <div className="mentor-detail-group-grid">
              {groups.map((group) => (
                <article
                  className="mentor-detail-group-card"
                  key={group.mentor_enrollment_id || group.group_id}
                >
                  <header>
                    <span>
                      GROUP #{String(group.group_id).padStart(3, "0")}
                    </span>

                    <strong
                      className={`mentor-detail-group-status mentor-detail-group-status-${group.group_status}`}
                    >
                      {group.group_status === "active" ? "Фаъол" : "Анҷомшуда"}
                    </strong>
                  </header>

                  <h4>{group.group_title || "Гурӯҳ"}</h4>

                  <div className="mentor-detail-group-data">
                    <div>
                      <span>Курс</span>
                      <strong>{group.course_title || "—"}</strong>
                    </div>

                    <div>
                      <span>Филиал</span>
                      <strong>{group.branch || "—"}</strong>
                    </div>

                    <div>
                      <span>Оғоз</span>
                      <strong>{formatDate(group.start_date)}</strong>
                    </div>

                    <div>
                      <span>Анҷом</span>
                      <strong>{formatDate(group.end_date)}</strong>
                    </div>

                    <div>
                      <span>Нархи курс</span>
                      <strong>
                        {Number(group.course_price || 0).toLocaleString()} сомонӣ
                      </strong>
                    </div>
                  </div>

                  <div className="mentor-detail-card-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/groups/${group.group_id}`)}
                    >
                      Дидани гурӯҳ →
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/courses/${group.course_id}`)}
                    >
                      Дидани курс →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default MentorDetailPage;
