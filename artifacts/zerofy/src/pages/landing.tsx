import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Globe, Shield, Zap, Target, Users, TrendingDown, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

function Globe3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let angle = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.38;

      ctx.clearRect(0, 0, w, h);

      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.4);
      glow.addColorStop(0, "rgba(20, 184, 166, 0.08)");
      glow.addColorStop(1, "rgba(20, 184, 166, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Globe fill
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
      grad.addColorStop(0, "rgba(15, 23, 42, 0.95)");
      grad.addColorStop(0.6, "rgba(8, 47, 73, 0.9)");
      grad.addColorStop(1, "rgba(5, 150, 105, 0.4)");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Clip to globe circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // Latitude lines
      for (let lat = -75; lat <= 75; lat += 15) {
        const latRad = (lat * Math.PI) / 180;
        const ry = Math.sin(latRad) * r;
        const rx = Math.cos(latRad) * r;
        if (rx <= 0) continue;
        ctx.beginPath();
        ctx.ellipse(cx, cy + ry, rx, rx * 0.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(20, 184, 166, 0.18)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // Longitude lines — rotating
      const numMeridians = 12;
      for (let i = 0; i < numMeridians; i++) {
        const lonAngle = (i / numMeridians) * Math.PI + angle;
        const cosA = Math.cos(lonAngle);
        const rx = Math.abs(cosA) * r;
        const alpha = 0.08 + Math.abs(cosA) * 0.22;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, r, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(20, 184, 166, ${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // Glowing dots (simulating cities/data points)
      const dots = [
        { lat: 51.5, lon: -0.1 },  // London
        { lat: 40.7, lon: -74.0 }, // NYC
        { lat: 35.7, lon: 139.7 }, // Tokyo
        { lat: -33.9, lon: 18.4 }, // Cape Town
        { lat: 1.3, lon: 103.8 },  // Singapore
        { lat: 48.8, lon: 2.3 },   // Paris
        { lat: 55.7, lon: 37.6 },  // Moscow
        { lat: -23.5, lon: -46.6 }, // Sao Paulo
        { lat: 19.4, lon: -99.1 }, // Mexico City
        { lat: 28.6, lon: 77.2 },  // Delhi
        { lat: -37.8, lon: 144.9 }, // Melbourne
        { lat: 31.2, lon: 121.5 }, // Shanghai
      ];

      for (const dot of dots) {
        const latRad = (dot.lat * Math.PI) / 180;
        const lonRad = (dot.lon * Math.PI) / 180 + angle * 2;
        const x = cx + r * Math.cos(latRad) * Math.sin(lonRad);
        const y = cy - r * Math.sin(latRad);
        const visibility = Math.cos(latRad) * Math.cos(lonRad);
        if (visibility < 0.1) continue;

        const dotAlpha = Math.min(1, visibility * 1.5);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${dotAlpha * 0.9})`;
        ctx.fill();

        // Pulse ring
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52, 211, 153, ${dotAlpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();

      // Globe border
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const borderGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      borderGrad.addColorStop(0, "rgba(52, 211, 153, 0.5)");
      borderGrad.addColorStop(0.5, "rgba(20, 184, 166, 0.15)");
      borderGrad.addColorStop(1, "rgba(59, 130, 246, 0.3)");
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Specular highlight
      const highlight = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.3, cy - r * 0.3, r * 0.5);
      highlight.addColorStop(0, "rgba(255, 255, 255, 0.06)");
      highlight.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = highlight;
      ctx.fill();

      angle += 0.003;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1 } }),
};

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight font-mono uppercase">Zerofy</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Mission Control</Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Log In</Link>
                <Link href="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors uppercase font-mono tracking-wider text-xs">Initialize</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 z-0" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(20,184,166,0.06) 1px, transparent 0)",
          backgroundSize: "40px 40px"
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background z-0" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center space-x-2 border border-primary/30 bg-primary/10 px-3 py-1 rounded-full text-primary text-xs font-mono uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Telemetry Active</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-tight mb-6">
              Precision <br /><span className="text-primary">Climate</span><br /> Intelligence.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              Mission control for your carbon footprint. Real calculations. Deterministic scenarios. AI-driven reduction vectors. Take your impact seriously.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="inline-flex items-center justify-center space-x-2 bg-primary text-primary-foreground px-8 py-4 rounded-md font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors text-sm">
                <span>Start Telemetry</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center space-x-2 border border-border px-8 py-4 rounded-md font-bold uppercase tracking-wider hover:border-primary/50 transition-colors text-sm text-muted-foreground hover:text-foreground">
                <span>Log In</span>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[400px] lg:h-[560px] w-full"
          >
            <Globe3D />
            {/* Overlay Stats */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 bg-card/90 backdrop-blur-md border border-border/60 p-4 rounded-lg shadow-xl font-mono text-sm space-y-3 pointer-events-none">
              <div className="flex justify-between items-center gap-8">
                <span className="text-muted-foreground text-xs">CO2 PPM</span>
                <span className="text-primary font-bold">424.3</span>
              </div>
              <div className="flex justify-between items-center gap-8">
                <span className="text-muted-foreground text-xs">TEMP ANOMALY</span>
                <span className="text-destructive font-bold">+1.2°C</span>
              </div>
              <div className="flex justify-between items-center gap-8">
                <span className="text-muted-foreground text-xs">SEA LEVEL</span>
                <span className="text-yellow-400 font-bold">+3.7mm/yr</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/50 bg-card/20 py-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Global CO2 Avg", value: "4,700 kg", sub: "per person/year" },
            { label: "Users Tracking", value: "12,400+", sub: "active accounts" },
            { label: "CO2 Saved", value: "2.1M kg", sub: "by community" },
            { label: "Avg Score Gain", value: "+18 pts", sub: "after 90 days" },
          ].map((stat) => (
            <div key={stat.label} className="font-mono">
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground/60 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight font-mono uppercase">Core Systems</h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">Advanced modules for carbon vector analysis. Every number is real and computed.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Carbon Calculator",
                desc: "High-fidelity ingestion of your mobility, energy, diet, and consumption vectors. Computes precise kg CO2e using IPCC, ICAO, and Poore & Nemecek data sources.",
              },
              {
                icon: Shield,
                title: "Climate Twin Simulator",
                desc: "Run deterministic scenarios on alternative lifestyles. Tweak diet, mobility, and grid factors to project structural emissions reduction in real time.",
              },
              {
                icon: Zap,
                title: "Aria Intelligence",
                desc: "Algorithmic extraction of optimal reduction targets based on your actual profile. Ranked by cost-impact ratio, difficulty, and projected kg CO2e saved.",
              },
              {
                icon: TrendingDown,
                title: "Emission Tracking",
                desc: "Historical trend analysis with 6-month sparklines. Track your score trajectory, monthly deltas, and progress against personal reduction goals.",
              },
              {
                icon: Users,
                title: "Community Network",
                desc: "Global leaderboard of users improving their scores. Active community challenges with thousands of participants. Shared impact counter updated live.",
              },
              {
                icon: Award,
                title: "Goal Engine",
                desc: "Set measurable reduction targets by category. Track progress in kg CO2e. Get notified when milestones are reached. Build lasting habits.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card border border-border/50 p-8 rounded-xl hover:border-primary/40 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-3 font-mono">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight font-mono mb-6">
              Your footprint.<br /><span className="text-primary">Measured precisely.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands who have replaced vague climate anxiety with concrete numbers, targets, and achievable plans.
            </p>
            <Link href="/register" className="inline-flex items-center justify-center space-x-3 bg-primary text-primary-foreground px-10 py-5 rounded-md font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors text-sm">
              <Globe className="w-5 h-5" />
              <span>Initialize Your Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 text-center text-xs text-muted-foreground font-mono">
        <p>ZEROFY — CLIMATE INTELLIGENCE PLATFORM — {new Date().getFullYear()}</p>
        <p className="mt-2 opacity-60">Emission factors: IPCC AR5 · IEA 2023 · Poore & Nemecek 2018 · ICAO · UK DEFRA 2023</p>
      </footer>
    </div>
  );
}
