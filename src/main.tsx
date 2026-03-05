import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App crash:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Terjadi Kesalahan</h1>
            <p style={{ color: "#666", marginBottom: "1rem" }}>Silakan muat ulang halaman.</p>
            <button onClick={() => window.location.reload()} style={{ padding: "0.5rem 1.5rem", borderRadius: "0.5rem", border: "1px solid #ddd", cursor: "pointer", background: "#fff" }}>Muat Ulang</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
