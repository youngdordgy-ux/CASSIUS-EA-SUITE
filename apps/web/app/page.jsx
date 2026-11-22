
const features = [
  {
    title: "Strategy Research",
    description: "Explore forex strategy concepts and educational research."
  },
  {
    title: "Historical Testing",
    description: "Study strategy behaviour using historical market data."
  },
  {
    title: "Paper Simulation",
    description: "Practise with virtual portfolios without real-money trading."
  },
  {
    title: "Advanced Analytics",
    description: "Explore research reports, statistics and performance analysis."
  }
];

export default function Home() {
  return (
    <main className="container">
      <nav className="navbar">
        <h2>CASSIUS <span>EA SUITE</span></h2>
        <a href="#features">Explore</a>
      </nav>

      <section className="hero">
        <p className="eyebrow">
          FOREX RESEARCH • EDUCATION • ANALYTICS
        </p>

        <h1>
          Research the market.
          <br />
          <span>Understand the data.</span>
        </h1>

        <p className="description">
          Discover a modern platform for forex research,
          strategy analysis, historical testing and simulated portfolios.
        </p>

        <a className="button" href="#features">
          Explore the platform
        </a>

        <p className="disclaimer">
          Educational research and simulation only.
          No live trading or guaranteed returns.
        </p>
      </section>

      <section id="features" className="features">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <footer>
        © {new Date().getFullYear()} CASSIUS EA SUITE.
        All rights reserved.
      </footer>
    </main>
  );
}
