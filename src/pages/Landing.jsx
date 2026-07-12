import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Truck, Shield, BarChart3, Route, Users, Wrench,
  Fuel, Clock, ChevronRight, ArrowRight, Star,
  Sun, Moon, Zap, Globe, CheckCircle, MapPin, TrendingUp
} from 'lucide-react';

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [aboutRef, aboutVisible] = useInView();
  const [featRef, featVisible] = useInView();
  const [statsRef, statsVisible] = useInView();
  const [testRef, testVisible] = useInView();
  const [ctaRef, ctaVisible] = useInView();

  const features = [
    { icon: Truck, title: 'Fleet Registry', desc: 'Track every vehicle — type, capacity, odometer, cost, and real-time status at a glance.', color: '#3b82f6' },
    { icon: Users, title: 'Driver Management', desc: 'License tracking, safety scores, expiry alerts, and automated compliance enforcement.', color: '#10b981' },
    { icon: Route, title: 'Trip Dispatch', desc: 'Create, dispatch, complete, and cancel trips with full lifecycle state management.', color: '#8b5cf6' },
    { icon: Wrench, title: 'Maintenance', desc: 'Auto-set vehicles to "In Shop", track costs, and restore status on work completion.', color: '#f59e0b' },
    { icon: Fuel, title: 'Fuel & Expenses', desc: 'Log fuel consumption per trip, toll charges, insurance, and miscellaneous costs.', color: '#ef4444' },
    { icon: BarChart3, title: 'Analytics & ROI', desc: 'Fleet utilization, fuel efficiency, cost breakdowns, vehicle ROI, and CSV exports.', color: '#06b6d4' },
  ];

  const stats = [
    { value: '15+', label: 'Vehicles Tracked' },
    { value: '25+', label: 'Trips Managed' },
    { value: '10', label: 'Business Rules' },
    { value: '99.9%', label: 'Uptime SLA' },
  ];

  const testimonials = [
    { name: 'Ravi Kumar', role: 'Fleet Manager, MoveIt Logistics', quote: 'TransitOps reduced our dispatch errors by 80%. The business rule engine catches overloaded vehicles and expired licenses automatically.', rating: 4.9 },
    { name: 'Priya Sharma', role: 'Operations Head, QuickHaul', quote: 'The maintenance tracking alone saved us ₹2.5L per quarter. Vehicles automatically go to "In Shop" status — no manual toggling.', rating: 4.8 },
    { name: 'Amit Patel', role: 'Safety Officer, SafeFleet India', quote: 'License expiry alerts and safety score dashboards made our compliance audit a breeze. Best investment this year.', rating: 5.0 },
  ];

  const marqueeText = 'SMART DISPATCH • FLEET TRACKING • DRIVER COMPLIANCE • FUEL ANALYTICS • MAINTENANCE LOGS • ROI REPORTS • BUSINESS RULES • REAL-TIME STATUS • ';

  return (
    <div className="landing-page">
      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className={`landing-nav ${scrollY > 60 ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-nav-logo">
            <div className="landing-logo-icon"><Truck size={18} /></div>
            <span>Transit<span className="accent">Ops</span></span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#testimonials">Testimonials</a>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-theme-btn" onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>Get Started <ArrowRight size={14} /></button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="hero-bg-grid" />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="hero-content" style={{ transform: `translateY(${scrollY * 0.15}px)`, opacity: Math.max(0, 1 - scrollY / 600) }}>
          <div className="hero-badge">
            <Zap size={14} />
            <span>Smart Transport Operations Platform</span>
          </div>
          <h1 className="hero-title">
            Move Smarter.<br />
            <span className="hero-title-accent">Operate Faster.</span>
          </h1>
          <p className="hero-subtitle">
            End-to-end fleet management that digitizes vehicle dispatch, driver compliance,
            maintenance tracking, and operational analytics — all enforced by 10+ business rules.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              Launch Dashboard <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Features
            </button>
          </div>

          <div className="hero-stats-row">
            {stats.map((s, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Cards */}
        <div className="hero-floating-cards">
          <div className="floating-card fc-1" style={{ transform: `translateY(${scrollY * -0.08}px) rotate(-3deg)` }}>
            <div className="fc-icon" style={{ background: '#3b82f615', color: '#3b82f6' }}><Truck size={20} /></div>
            <div><strong>12 Active</strong><span>Vehicles on road</span></div>
          </div>
          <div className="floating-card fc-2" style={{ transform: `translateY(${scrollY * -0.12}px) rotate(2deg)` }}>
            <div className="fc-icon" style={{ background: '#10b98115', color: '#10b981' }}><CheckCircle size={20} /></div>
            <div><strong>98.5%</strong><span>Fleet utilization</span></div>
          </div>
          <div className="floating-card fc-3" style={{ transform: `translateY(${scrollY * -0.05}px) rotate(-1deg)` }}>
            <div className="fc-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><TrendingUp size={20} /></div>
            <div><strong>₹14.2L</strong><span>Revenue this month</span></div>
          </div>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────────── */}
      <div className="landing-marquee">
        <div className="marquee-track">
          <span>{marqueeText}{marqueeText}</span>
        </div>
      </div>

      {/* ── About ──────────────────────────────────────── */}
      <section id="about" className="landing-section" ref={aboutRef}>
        <div className={`landing-about ${aboutVisible ? 'visible' : ''}`}>
          <div className="about-visual">
            <div className="about-card-stack">
              <div className="about-stack-card asc-1">
                <Shield size={24} />
                <h4>10 Business Rules</h4>
                <p>Auto-enforced on every dispatch</p>
              </div>
              <div className="about-stack-card asc-2">
                <Globe size={24} />
                <h4>Multi-Region</h4>
                <p>North, South, West, Central</p>
              </div>
              <div className="about-stack-card asc-3">
                <Clock size={24} />
                <h4>Real-Time Status</h4>
                <p>Available → On Trip → In Shop</p>
              </div>
            </div>
          </div>
          <div className="about-content">
            <span className="section-tag"><MapPin size={14} /> About Us</span>
            <h2 className="section-heading">Built for logistics companies that still rely on spreadsheets</h2>
            <p className="section-desc">
              TransitOps digitizes your entire transport workflow — from vehicle registration to trip dispatch,
              driver compliance to maintenance scheduling, fuel tracking to cost analytics. Every action is
              validated against business rules so errors are caught before they happen.
            </p>
            <ul className="about-checks">
              <li><CheckCircle size={16} /> Prevents dispatching on-trip or retired vehicles</li>
              <li><CheckCircle size={16} /> Blocks drivers with expired licenses automatically</li>
              <li><CheckCircle size={16} /> Cargo weight validation against vehicle capacity</li>
              <li><CheckCircle size={16} /> Transactional status updates across entities</li>
            </ul>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Try It Free <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="landing-section landing-section-alt" ref={featRef}>
        <div className="section-center">
          <span className="section-tag"><Zap size={14} /> Features</span>
          <h2 className="section-heading">Everything you need to run your fleet</h2>
          <p className="section-desc center">Six powerful modules working in harmony to manage your complete transport operations lifecycle.</p>
        </div>
        <div className={`features-grid ${featVisible ? 'visible' : ''}`}>
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="feature-icon" style={{ background: `${f.color}12`, color: f.color }}>
                <f.icon size={22} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="feature-arrow"><ChevronRight size={16} /></span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats Counter ──────────────────────────────── */}
      <section className="landing-stats-section" ref={statsRef}>
        <div className={`landing-stats-grid ${statsVisible ? 'visible' : ''}`}>
          <div className="stats-text">
            <h2>Trusted by fleet operators across India</h2>
            <p>Built for hackathons, production-ready by design. TransitOps enforces the rules your business needs.</p>
          </div>
          <div className="stats-numbers">
            {[
              { val: '4', label: 'RBAC Roles', icon: Users },
              { val: '7', label: 'Database Tables', icon: BarChart3 },
              { val: '10', label: 'Business Rules', icon: Shield },
              { val: '∞', label: 'Scalability', icon: TrendingUp },
            ].map((s, i) => (
              <div key={i} className="stat-block" style={{ animationDelay: `${i * 100}ms` }}>
                <s.icon size={20} className="stat-icon" />
                <span className="stat-val">{s.val}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────── */}
      <section id="testimonials" className="landing-section" ref={testRef}>
        <div className="section-center">
          <span className="section-tag"><Star size={14} /> Testimonials</span>
          <h2 className="section-heading">What our users say</h2>
        </div>
        <div className={`testimonials-grid ${testVisible ? 'visible' : ''}`}>
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="testimonial-stars">
                {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={14} fill={j < Math.floor(t.rating) ? '#f59e0b' : 'none'} color="#f59e0b" />)}
                <span>{t.rating}</span>
              </div>
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.name.charAt(0)}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="landing-cta" ref={ctaRef}>
        <div className={`cta-inner ${ctaVisible ? 'visible' : ''}`}>
          <div className="cta-glow" />
          <h2>Ready to digitize your fleet operations?</h2>
          <p>Get started in seconds. No credit card required. Four roles, one platform.</p>
          <div className="cta-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              Launch TransitOps <ArrowRight size={16} />
            </button>
          </div>
          <div className="cta-credentials">
            <span>Demo login: <code>fleet@transitops.in</code> / <code>Transit@2026</code></span>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="landing-nav-logo">
              <div className="landing-logo-icon"><Truck size={16} /></div>
              <span>Transit<span className="accent">Ops</span></span>
            </div>
            <p>Smart Transport Operations Platform</p>
          </div>
          <div className="footer-links">
            <div>
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#about">About</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div>
              <h4>Modules</h4>
              <a onClick={() => navigate('/login')}>Fleet Registry</a>
              <a onClick={() => navigate('/login')}>Trip Dispatch</a>
              <a onClick={() => navigate('/login')}>Analytics</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 TransitOps. Built for hackathons, production-ready by design.</span>
        </div>
      </footer>
    </div>
  );
}
