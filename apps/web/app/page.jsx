
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const navigation = [
  "Overview",
  "Strategies",
  "Backtesting",
  "Paper Trading",
  "Analytics",
  "Market Research"
];

const features = [
  {
    title: "Strategy Research",
    description: "Create, organize and evaluate forex trading strategies.",
    tab: "Strategies"
  },
  {
    title: "Historical Backtesting",
    description: "Evaluate strategy rules against historical market data.",
    tab: "Backtesting"
  },
  {
    title: "Paper Trading",
    description: "Simulate trades using virtual funds without risking money.",
    tab: "Paper Trading"
  },
  {
    title: "Advanced Analytics",
    description: "Study drawdown, win rate, risk and performance statistics.",
    tab: "Analytics"
  }
];

export default function Home() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Overview");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [databaseError, setDatabaseError] = useState("");

  const [stats, setStats] = useState({
    strategies: 0,
    backtests: 0,
    trades: 0,
    candles: 0
  });

  const loadMetrics = useCallback(async () => {
    setRefreshing(true);
    setDatabaseError("");

    try {
      const results = await Promise.all([
        supabase
          .from("strategies")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("backtest_runs")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("demo_trades")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("market_candles")
          .select("*", { count: "exact", head: true })
      ]);

      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        setDatabaseError(
          errors.map(result => result.error.message).join(" | ")
        );
      }

      setStats({
        strategies: results[0].error ? null : results[0].count ?? 0,
        backtests: results[1].error ? null : results[1].count ?? 0,
        trades: results[2].error ? null : results[2].count ?? 0,
        candles: results[3].error ? null : results[3].count ?? 0
      });
    } catch (error) {
      setDatabaseError(error.message || "Unable to load database information.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    async function initialize() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error || !data.user) {
          router.replace("/login");
          return;
        }

        setUserEmail(data.user.email || "Authenticated user");

        await loadMetrics();

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          router.replace("/login");
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, loadMetrics]);

  async function handleLogout() {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Unable to sign out. Please try again.");
      setSigningOut(false);
      return;
    }

    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="dashboard">
        <p>Loading CASSIUS EA SUITE...</p>
      </main>
    );
  }

  const cards = [
    {
      label: "Active Strategies",
      value: stats.strategies ?? "—",
      detail: "Records in your strategies table"
    },
    {
      label: "Backtests",
      value: stats.backtests ?? "—",
      detail: "Recorded backtest runs"
    },
    {
      label: "Paper Trades",
      value: stats.trades ?? "—",
      detail: "Recorded simulated trades"
    },
    {
      label: "Historical Candles",
      value: stats.candles ?? "—",
      detail: "Stored market candle records"
    }
  ];

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          CASSIUS
          <span>EA SUITE</span>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav className="side-nav">
          {navigation.map(item => (
            <button
              key={item}
              className={
                activeTab === item
                  ? "nav-item active"
                  : "nav-item"
              }
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
            AUTHENTICATED

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
                cursor: signingOut ? "not-allowed" : "pointer"
              }}
            >
              {signingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow">
              TRADING RESEARCH PLATFORM
            </p>

            <h1>{activeTab}</h1>

            <p>
              Welcome, {userEmail}. Your workspace for strategy
              research, market analysis and portfolio simulation.
            </p>
          </div>

          <button
            onClick={loadMetrics}
            disabled={refreshing}
            style={{
              padding: "12px 18px",
              background: "#1769df",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </section>

        {databaseError && (
          <div
            style={{
              padding: "14px",
              marginBottom: "20px",
              background: "#3b2020",
              color: "#ffb5b5",
              borderRadius: "8px",
              overflowWrap: "anywhere"
            }}
          >
            Database warning: {databaseError}
          </div>
        )}

        <section className="stats-grid">
          {cards.map(card => (
            <article className="stat-card" key={card.label}>
              <p>{card.label}</p>
              <h2>{card.value}</h2>
              <span>{card.detail}</span>
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
                onClick={() => setActiveTab(feature.tab)}
              >
                Open module →
              </button>
            </article>
          ))}
        </section>

        <footer className="footer">
          <span>
            © {new Date().getFullYear()} CASSIUS EA SUITE
          </span>

          <span>
            Educational research and simulation environment
          </span>
        </footer>
      </section>
    </main>
  );
}
