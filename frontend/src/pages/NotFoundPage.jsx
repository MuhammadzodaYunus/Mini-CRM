import { Link } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";

import "../styles/profile.css";

function NotFoundPage() {
  return (
    <MainLayout
      title="Саҳифа ёфт нашуд"
      description="Суроғаи воридшуда дар система вуҷуд надорад."
    >
      <section className="not-found-card">
        <span>404</span>
        <h2>Ин саҳифа вуҷуд надорад</h2>
        <p>
          Суроға метавонад хато бошад ё саҳифа дигар дастрас набошад.
        </p>
        <Link to="/dashboard">Ба Dashboard баргаштан</Link>
      </section>
    </MainLayout>
  );
}

export default NotFoundPage;
