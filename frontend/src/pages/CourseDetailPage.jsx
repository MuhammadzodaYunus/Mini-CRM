import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import {
  ResourceAlert,
  ResourceLoading,
} from "../components/ui/ResourceState";
import { extractApiError, formatDate } from "../utils/data";

import "../styles/detail.css";

function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCourse() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/education/courses/${id}/`,
      );

      setCourse(response.data);
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Маълумоти курс гирифта нашуд.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourse();
  }, [id]);

  if (loading) {
    return (
      <MainLayout
        title="Маълумоти курс"
        description="Маълумоти курс гирифта шуда истодааст."
      >
        <ResourceLoading label="Маълумоти курс бор шуда истодааст..." />
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout
        title="Курс ёфт нашуд"
        description="Маълумоти ин курс дастрас нест."
      >
        <div className="detail-page">
          <ResourceAlert type="error">
            {error || "Курс вуҷуд надорад."}
          </ResourceAlert>

          <button
            type="button"
            className="detail-back-button"
            onClick={() => navigate("/courses")}
          >
            ← Бозгашт ба курсҳо
          </button>
        </div>
      </MainLayout>
    );
  }

  const groups = Array.isArray(course.groups)
    ? course.groups
    : [];

  const activeGroupsCount =
    course.active_groups_count ??
    groups.filter((group) => group.status === "active").length;

  const finishedGroupsCount = groups.filter(
    (group) => group.status === "finished",
  ).length;

  return (
    <MainLayout
      title={course.title}
      description="Маълумоти пурраи курс ва гурӯҳҳои ба он вобаста."
    >
      <div className="detail-page">
        <ResourceAlert
          type="error"
          onClose={() => setError("")}
        >
          {error}
        </ResourceAlert>

        <div className="detail-top-actions">
          <button
            type="button"
            className="detail-back-button"
            onClick={() => navigate("/courses")}
          >
            ← Бозгашт ба курсҳо
          </button>

          <button
            type="button"
            className="detail-refresh-button"
            onClick={loadCourse}
          >
            Навсозӣ
          </button>
        </div>

        <section className="detail-hero">
          <div className="detail-hero-content">
            <span className="detail-label">
              COURSE #{String(course.id).padStart(3, "0")}
            </span>

            <h2>{course.title}</h2>

            <p>
              {course.description ||
                "Барои ин курс ҳоло тавсиф навишта нашудааст."}
            </p>
          </div>

          <div className="detail-price-card">
            <span>Нархи курс</span>

            <strong>
              {Number(course.price || 0).toLocaleString()}
            </strong>

            <small>сомонӣ</small>
          </div>
        </section>

        <section className="detail-statistics">
          <article className="detail-stat-card">
            <div className="detail-stat-icon">▣</div>

            <div>
              <span>Ҳамаи гурӯҳҳо</span>

              <strong>
                {course.groups_count ?? groups.length}
              </strong>
            </div>
          </article>

          <article className="detail-stat-card">
            <div className="detail-stat-icon detail-stat-icon-success">
              ✓
            </div>

            <div>
              <span>Гурӯҳҳои фаъол</span>
              <strong>{activeGroupsCount}</strong>
            </div>
          </article>

          <article className="detail-stat-card">
            <div className="detail-stat-icon detail-stat-icon-muted">
              ◷
            </div>

            <div>
              <span>Гурӯҳҳои анҷомшуда</span>
              <strong>{finishedGroupsCount}</strong>
            </div>
          </article>
        </section>

        <section className="detail-section">
          <header className="detail-section-header">
            <div>
              <span className="detail-section-label">
                COURSE GROUPS
              </span>

              <h3>Гурӯҳҳои ҳамин курс</h3>

              <p>
                Барои дидани донишҷӯён, омӯзгорон ва ҷадвали
                дарсӣ гурӯҳро кушоед.
              </p>
            </div>

            <span className="detail-section-count">
              {groups.length} гурӯҳ
            </span>
          </header>

          {groups.length === 0 ? (
            <div className="detail-empty">
              <div className="detail-empty-icon">▣</div>

              <strong>Гурӯҳ вуҷуд надорад</strong>

              <p>
                Барои ин курс ҳоло ягон гурӯҳ сохта нашудааст.
              </p>

              <button
                type="button"
                className="detail-open-button detail-empty-button"
                onClick={() => navigate("/groups")}
              >
                Ба гурӯҳҳо гузаштан
              </button>
            </div>
          ) : (
            <div className="detail-group-grid">
              {groups.map((group) => (
                <article
                  className="detail-group-card"
                  key={group.id}
                >
                  <header className="detail-group-card-header">
                    <div className="detail-group-icon">
                      ▣
                    </div>

                    <span
                      className={`detail-status detail-status-${group.status}`}
                    >
                      {group.status}
                    </span>
                  </header>

                  <span className="detail-group-id">
                    GROUP #{String(group.id).padStart(3, "0")}
                  </span>

                  <h4>{group.title}</h4>

                  <div className="detail-group-info">
                    <div>
                      <span>Филиал</span>
                      <strong>{group.branch || "—"}</strong>
                    </div>

                    <div>
                      <span>Санаи оғоз</span>
                      <strong>
                        {formatDate(group.start_date)}
                      </strong>
                    </div>

                    <div>
                      <span>Санаи анҷом</span>
                      <strong>
                        {formatDate(group.end_date)}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="detail-open-button"
                    onClick={() =>
                      navigate(`/groups/${group.id}`)
                    }
                  >
                    Дидани маълумоти гурӯҳ
                    <span>→</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default CourseDetailPage;