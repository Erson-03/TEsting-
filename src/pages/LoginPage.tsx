import { BarChart3, BrainCircuit, LockKeyhole, Moon, ShieldCheck, Sparkles, Sun } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function LoginPage() {
  useDocumentTitle("Login");
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [email, setEmail] = useState("admin@para.local");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  if (authenticated) return <Navigate to="/dashboard" replace />;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      const state = location.state as { from?: string } | null;
      showToast("Welcome to PARA.");
      navigate(state?.from || "/dashboard", { replace: true });
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Login failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page modern-login">
      <div className="ambient-layer login-ambient" aria-hidden="true">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-orb ambient-orb-three" />
        <span className="ambient-grid" />
      </div>

      <Button
        className="login-theme-toggle"
        variant="ghost"
        icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        onClick={toggleTheme}
        title={theme === "dark" ? "Use light theme" : "Use dark theme"}
      >
        {theme === "dark" ? "Light" : "Dark"}
      </Button>

      <section className="login-showcase glass-dark-panel">
        <div className="brand-large">
          <div className="brand-logo brand-logo-xl"><span /><span /><span /></div>
          <div><strong>PARA</strong><p>Pricing Analytics and Recommendation Assistant</p></div>
        </div>

        <div className="login-copy">
          <span className="eyebrow light-eyebrow"><Sparkles size={13} /> MODERN PRICING DECISION WORKSPACE</span>
          <h1>Smarter pricing decisions without losing human control.</h1>
          <p>Explore pricing analytics, demand signals, recommendations, fairness checks, explainability, and audit history in a focused interface designed for clear decisions.</p>
          <div className="login-feature-grid">
            <div><BarChart3 size={20} /><span>Readable analytics and responsive charts</span></div>
            <div><BrainCircuit size={20} /><span>Explainable pricing recommendations</span></div>
            <div><ShieldCheck size={20} /><span>Responsible pricing guardrails</span></div>
            <div><LockKeyhole size={20} /><span>Human review and decision history</span></div>
          </div>
        </div>

        <small>Responsible pricing decision support</small>
      </section>

      <section className="login-card-wrap">
        <form className="login-card glass-surface" onSubmit={submit}>
          <div className="login-card-heading">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Sign in to PARA</h2>
            <p>Enter your account credentials to continue to the pricing workspace.</p>
          </div>

          <label className="form-field"><span>Email Address</span><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="form-field"><span>Password</span><input type="password" autoComplete="current-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} /></label>

          <Button type="submit" fullWidth loading={loading}>Sign In to Workspace</Button>
        </form>
      </section>
    </div>
  );
}
