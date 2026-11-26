
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const navigation = [
  "Overview",
  "Strategies",
  "Backtesting",
  "Paper Trading",
  "Analytics",
  "Market Research"
];

const stats = [
  { label: "Active Strategies", value: "00", detail: "No strategies configured" },
  { label: "Backtests Completed", value: "00", detail: "Awaiting historical data" },
  { label: "Paper Portfolio", value: "$10,000", detail: "Virtual starting balance" },
  { label: "Market Connections", value: "Offline", detail: "No provider connected" }
];

const features = [
  {
    title: "Strategy Research",
    description: "Create, organize and evaluate forex trading strategies."
  },
  {
    title: "Historical Backtesting",
    description: "Evaluate strategy rules against historical market data."
  },
  {
    title: "Paper Trading",
    description: "Simulate trades using virtual funds without risking money."
  },
  {
    title: "Advanced Analytics",
    description: "Study drawdown, win rate, risk and performance statistics."
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(data.user.email || "Authenticated user");
      setLoading(false);
    }

    loadUser();
  }, []);

  async function handleLogout() {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Unable to sign out. Please try again.");
      setSigningOut(false);
      return;
    }

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="dashboard">
        <p>Loading CASSIUS EA SUITE...</p>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          CASSIUS
          <span>EA SUITE</span>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav className="side-nav">
          {navigation.map((item) => (
            <button
              key={item}
              className={activeTab === item ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span className="status-dot"></span>
          Research environment
          <p>Version 1.0.0</p>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">CASSIUS TECHNOLOGIES</p>
            <h2>EA Suite Workspace</h2>
          </div>

          <div className="profile">
            <span className="online-dot"></span>
            SYSTEM READY

            <button
              onClick={handleLogout}
              disabled={signingOut}
              style={{
                marginLeft: "15px",
                padding: "9px 14px",
                background: "#1769df",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              {signingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow">TRADING RESEARCH PLATFORM</p>
            <h1>{activeTab}</h1>
            <p>
              Welcome, {userEmail}. Your professional environment
              for strategy research, market analysis and portfolio simulation.
            </p>
          </div>
        </section>

        <section className="stats-grid">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <p>{stat.label}</p>
              <h2>{stat.value}</h2>
              <span>{stat.detail}</span>
            </article>
          ))}
        </section>

        <section className="section-heading">
          <div>
            <p className="eyebrow">PLATFORM MODULES</p>
            <h2>Research and Development</h2>
          </div>
        </section>

        <section className="feature-grid">
          {features.map((feature, index) => (
            <article className="module-card" key={feature.title}>
              <span className="module-number">
                0{index + 1}
              </span>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

              <button
                onClick={() => setActiveTab(
                  ["Strategies", "Backtesting", "Paper Trading", "Analytics"][index]
                )}
              >
                Open module →
              </button>
            </article>
          ))}
        </section>

        <footer className="footer">
          <span>© {new Date().getFullYear()} CASSIUS EA SUITE</span>
          <span>Educational research and simulation environment</span>
        </footer>
      </section>
    </main>
  );
}
