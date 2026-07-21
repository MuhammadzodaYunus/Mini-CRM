import Sidebar from "./Sidebar";
import Header from "./Header";
import "../../styles/layout.css";

function MainLayout({
  title,
  description,
  children,
}) {
  return (
    <div className="application-layout">
      <Sidebar />

      <main className="application-main">
        <Header
          title={title}
          description={description}
        />

        <section className="application-page-content">
          {children}
        </section>
      </main>
    </div>
  );
}

export default MainLayout;