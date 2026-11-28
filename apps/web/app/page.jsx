
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

const emptyForm = {
  name: "",
  mode: "Research",
  symbol: "EURUSD",
  timeframe: "M5",
  enabled: true
};

export default function Home() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Overview");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [strategies, setStrategies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    strategies: 0,
    backtests: 0,
    trades: 0,
    candles: 0
  });

  const loadStrategies = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("strategies")
      .select(
        "id,user_id,name,mode,symbol,timeframe,enabled,config,created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Unable to load strategies: " + error.message);
      return;
    }

    setStrategies(data || []);
  }, [userId]);

  const loadMetrics = useCallback(async () => {
    if (!userId) return;

    const tables = [
      "strategies",
      "backtest_runs",
      "demo_trades",
      "market_candles"
    ];

    const results = await Promise.all(
      tables.map(table =>
        supabase
          .from(table)
          .select("*", { count: "exact", head: true })
      )
    );

    setStats({
      strategies: results[0].error ? "—" : results[0].count ?? 0,
      backtests: results[1].error ? "—" : results[1].count ?? 0,
      trades: results[2].error ? "—" : results[2].count ?? 0,
      candles: results[3].error ? "—" : results[3].count ?? 0
    });
  }, [userId]);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    async function initialize() {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setUserEmail(data.user.email || "Authenticated user");
      setUserId(data.user.id);
      setLoading(false);
    }

    initialize();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (userId) {
      loadStrategies();
      loadMetrics();
    }
  }, [userId, loadStrategies, loadMetrics]);

  function updateField(field, value) {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  }

  function startNewStrategy() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function startEditing(strategy) {
    setForm({
      name: strategy.name,
      mode: strategy.mode,
      symbol: strategy.symbol,
      timeframe: strategy.timeframe,
      enabled: strategy.enabled ?? false
    });

    setEditingId(strategy.id);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  async function saveStrategy(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Please enter a strategy name.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const strategyData = {
      name: form.name.trim(),
      mode: form.mode,
      symbol: form.symbol,
      timeframe: form.timeframe,
      enabled: form.enabled,
      config: editingId
        ? strategies.find(item => item.id === editingId)?.config || {}
        : {}
    };

    try {
      let result;

      if (editingId) {
        result = await supabase
          .from("strategies")
          .update(strategyData)
          .eq("id", editingId)
          .eq("user_id", userId);
      } else {
        result = await supabase
          .from("strategies")
          .insert({
            ...strategyData,
            user_id: userId
          });
      }

      if (result.error) {
        throw result.error;
      }

      setMessage(
        editingId
          ? "Strategy updated successfully."
          : "Strategy created successfully."
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadStrategies();
      await loadMetrics();
    } catch (err) {
      setError(err.message || "Unable to save strategy.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStrategy(strategy) {
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("strategies")
      .update({ enabled: !strategy.enabled })
      .eq("id", strategy.id)
      .eq("user_id", userId);

    if (error) {
      setError("Unable to change strategy: " + error.message);
      return;
    }

    setMessage("Strategy status updated.");
    await loadStrategies();
  }

  async function deleteStrategy(strategy) {
    const confirmed = window.confirm(
      "Delete strategy " + strategy.name + "?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error } = await supabase
      .from("strategies")
      .delete()
      .eq("id", strategy.id)
      .eq("user_id", userId);

    if (error) {
      setError("Unable to delete strategy: " + error.message);
      return;
    }

    setMessage("Strategy deleted.");
    await loadStrategies();
    await loadMetrics();
  }

  async function handleLogout() {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setError("Unable to sign out: " + error.message);
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

  const statCards = [
    {
      label: "Strategies",
      value: stats.strategies,
      detail: "Stored strategy records"
    },
    {
      label: "Backtests",
      value: stats.backtests,
      detail: "Recorded backtest runs"
    },
    {
      label: "Paper Trades",
      value: stats.trades,
      detail: "Simulated trade records"
    },
    {
      label: "Market Candles",
      value: stats.candles,
      detail: "Historical data records"
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
              style={buttonStyle}
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
              Welcome, {userEmail}. Your research and simulation workspace.
            </p>
          </div>

          <button
            onClick={() => {
              loadStrategies();
              loadMetrics();
            }}
            style={buttonStyle}
          >
            Refresh Data
          </button>
        </section>

        {message && (
          <p style={successStyle}>{message}</p>
        )}

        {error && (
          <p style={errorStyle}>{error}</p>
        )}

        {activeTab === "Overview" && (
          <>
            <section className="stats-grid">
              {statCards.map(card => (
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
              {[
                "Strategies",
                "Backtesting",
                "Paper Trading",
                "Analytics"
              ].map((item, index) => (
                <article className="module-card" key={item}>
                  <span className="module-number">
                    0{index + 1}
                  </span>
                  <h3>{item}</h3>
                  <p>Open the {item.toLowerCase()} workspace.</p>
                  <button onClick={() => setActiveTab(item)}>
                    Open module →
                  </button>
                </article>
              ))}
            </section>
          </>
        )}

        {activeTab === "Strategies" && (
          <section style={{ padding: "10px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "25px"
              }}
            >
              <div>
                <h2>Strategy Management</h2>
                <p>Create and manage your research configurations.</p>
              </div>

              <button
                onClick={startNewStrategy}
                style={buttonStyle}
              >
                + New Strategy
              </button>
            </div>

            {showForm && (
              <form
                onSubmit={saveStrategy}
                style={formStyle}
              >
                <h3>
                  {editingId ? "Edit Strategy" : "Create Strategy"}
                </h3>

                <label style={labelStyle}>
                  Strategy Name
                  <input
                    value={form.name}
                    onChange={e =>
                      updateField("name", e.target.value)
                    }
                    placeholder="Example: EURUSD Trend Research"
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Research Mode
                  <select
                    value={form.mode}
                    onChange={e =>
                      updateField("mode", e.target.value)
                    }
                    style={inputStyle}
                  >
                    <option value="Research">Research</option>
                    <option value="Simulation">Simulation</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Forex Pair
                  <select
                    value={form.symbol}
                    onChange={e =>
                      updateField("symbol", e.target.value)
                    }
                    style={inputStyle}
                  >
                    {[
                      "EURUSD",
                      "GBPUSD",
                      "USDJPY",
                      "AUDUSD",
                      "USDCAD"
                    ].map(symbol => (
                      <option key={symbol} value={symbol}>
                        {symbol}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={labelStyle}>
                  Timeframe
                  <select
                    value={form.timeframe}
                    onChange={e =>
                      updateField("timeframe", e.target.value)
                    }
                    style={inputStyle}
                  >
                    {["M1", "M5", "M15", "M30", "H1", "H4", "D1"].map(
                      timeframe => (
                        <option key={timeframe} value={timeframe}>
                          {timeframe}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label style={labelStyle}>
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={e =>
                      updateField("enabled", e.target.checked)
                    }
                  />
                  Enable research configuration
                </label>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={buttonStyle}
                  >
                    {saving ? "Saving..." : "Save Strategy"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {strategies.length === 0 ? (
              <div style={formStyle}>
                <h3>No strategies created yet</h3>
                <p>
                  Create your first research configuration to get started.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {strategies.map(strategy => (
                  <article
                    key={strategy.id}
                    style={formStyle}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "10px"
                      }}
                    >
                      <div>
                        <h3>{strategy.name}</h3>
                        <p>
                          {strategy.symbol} · {strategy.timeframe}
                        </p>
                        <p>Mode: {strategy.mode}</p>
                        <p>
                          Status: {strategy.enabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          alignItems: "center"
                        }}
                      >
                        <button
                          onClick={() => toggleStrategy(strategy)}
                          style={secondaryButtonStyle}
                        >
                          {strategy.enabled ? "Disable" : "Enable"}
                        </button>

                        <button
                          onClick={() => startEditing(strategy)}
                          style={buttonStyle}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteStrategy(strategy)}
                          style={deleteButtonStyle}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab !== "Overview" &&
          activeTab !== "Strategies" && (
            <section style={formStyle}>
              <h2>{activeTab}</h2>
              <p>
                This module is awaiting implementation and testing.
              </p>
            </section>
          )}

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

const buttonStyle = {
  padding: "10px 16px",
  background: "#1769df",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};

const secondaryButtonStyle = {
  padding: "10px 16px",
  background: "#303b4c",
  color: "#fff",
  border: "1px solid #526078",
  borderRadius: "6px",
  cursor: "pointer"
};

const deleteButtonStyle = {
  padding: "10px 16px",
  background: "#762d36",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};

const formStyle = {
  padding: "22px",
  marginBottom: "20px",
  background: "#151e2c",
  border: "1px solid #29384d",
  borderRadius: "10px",
  color: "#fff"
};

const labelStyle = {
  display: "grid",
  gap: "8px",
  marginBottom: "16px"
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  background: "#0c1420",
  color: "#fff",
  border: "1px solid #40516a",
  borderRadius: "6px"
};

const successStyle = {
  padding: "12px",
  background: "#153d2a",
  color: "#9be6b5",
  borderRadius: "6px"
};

const errorStyle = {
  padding: "12px",
  background: "#48232a",
  color: "#ffb5b5",
  borderRadius: "6px"
};
