import { Component } from "react";

import "../../styles/profile.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Frontend render error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleDashboard = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error-page">
          <section className="fatal-error-card">
            <span className="fatal-error-code">FRONTEND ERROR</span>
            <h1>Саҳифа дуруст намоиш дода нашуд</h1>
            <p>
              Хатои ногаҳонии интерфейс рух дод. Маълумоти база ҳазф
              нашудааст. Саҳифаро аз нав бор кунед.
            </p>

            <div className="fatal-error-actions">
              <button type="button" onClick={this.handleReload}>
                Аз нав бор кардан
              </button>

              <button
                type="button"
                className="fatal-error-secondary"
                onClick={this.handleDashboard}
              >
                Ба Dashboard
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
