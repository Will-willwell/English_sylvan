import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Headphones,
  LayoutDashboard,
  LockKeyhole,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  Waves,
  X,
} from "lucide-react";
import {
  allUnits,
  audioSources,
  lessonContent,
  sections,
  type LessonContent,
  type Unit,
} from "./data/course";
import { AuthModal } from "./components/AuthModal";
import { AdminPanel } from "./components/AdminPanel";
import { AccountPanel } from "./components/AccountPanel";
import { PwaInstallButton } from "./components/PwaInstallButton";
import { VoicePicker } from "./components/VoicePicker";
import { AudioTestButton } from "./components/AudioTestButton";
import { ReviewPanel } from "./components/ReviewPanel";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { lessonEnrichment } from "./data/lessonEnrichment";
import { isSupabaseConfigured, supabase, userToUsername } from "./lib/supabase";
import { recordActivity } from "./lib/activity";
import { applyReview, createInitialReview, readReviewStates, reviewStorageKey, type ReviewRating, type ReviewState } from "./lib/review";
import { claimDeviceSession, checkDeviceSession, releaseDeviceSession } from "./lib/session";
import { speakEnglish } from "./lib/speech";

const STORAGE_KEY = "business-speaking-progress-v1";

type ProgressRow = {
  unit_id: number;
  progress: number;
};

function readProgress(storageKey: string): Record<number, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([unitId, value]) =>
        /^\d+$/.test(unitId) && typeof value === "number" && Number.isFinite(value),
      ),
    ) as Record<number, number>;
  } catch {
    return {};
  }
}

function progressStorageKey(userId?: string) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

function pendingProgressStorageKey(userId: string) {
  return `${STORAGE_KEY}:pending:${userId}`;
}

function readPendingProgress(userId: string): Record<number, number> {
  return readProgress(pendingProgressStorageKey(userId));
}

function writePendingProgress(userId: string, progress: Record<number, number>) {
  localStorage.setItem(pendingProgressStorageKey(userId), JSON.stringify(progress));
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

type SpeechRecognitionEventLike = Event & {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type WindowWithSpeech = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

function App() {
  const [activeUnitId, setActiveUnitId] = useState(1);
  const [activeSection, setActiveSection] = useState("all");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"learn" | "practice" | "dialogue">("learn");
  const [savedProgress, setSavedProgress] = useState<Record<number, number>>(() => readProgress(STORAGE_KEY));
  const [reviewStates, setReviewStates] = useState<Record<number, ReviewState>>(() => readReviewStates(reviewStorageKey()));
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isSupabaseConfigured);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [openModule, setOpenModule] = useState<"review" | "lesson" | "curriculum">("lesson");
  const [viewMode, setViewMode] = useState<"overview" | "module">("overview");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "offline" | "error">("idle");
  const [deviceStatus, setDeviceStatus] = useState<"checking" | "active" | "offline" | "revoked" | "error">("checking");
  const progressLoadRef = useRef(0);
  const pendingProgressRef = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthUser(data.session?.user ?? null);
      setAuthChecking(false);
    }).catch(() => {
      if (mounted) setAuthChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthChecking(false);
      if (event === "SIGNED_IN" && session?.user) {
        void recordActivity({
          userId: session.user.id,
          activityType: "login",
          metadata: { source: "web" },
        });
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured && !authChecking && !authUser) setShowAuthModal(true);
  }, [authChecking, authUser]);

  useEffect(() => {
    if (!authUser || !supabase) {
      setDeviceStatus("checking");
      return;
    }
    let cancelled = false;
    const claim = async () => {
      if (!navigator.onLine) {
        if (!cancelled) setDeviceStatus("offline");
        return;
      }
      try {
        await claimDeviceSession();
        if (!cancelled) setDeviceStatus("active");
      } catch (error) {
        console.warn("Single-device session could not be claimed.", error);
        if (!cancelled) setDeviceStatus(navigator.onLine ? "error" : "offline");
      }
    };
    void claim();
    const interval = window.setInterval(async () => {
      if (!navigator.onLine) {
        setDeviceStatus("offline");
        return;
      }
      try {
        const result = await checkDeviceSession();
        if (result.active) setDeviceStatus("active");
        else {
          setDeviceStatus("revoked");
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.warn("Single-device session check failed.", error);
        setDeviceStatus(navigator.onLine ? "error" : "offline");
      }
    }, 30000);
    const onOnline = () => void claim();
    const onOffline = () => setDeviceStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser || !supabase) {
      setIsAdmin(false);
      setShowAdminPanel(false);
      return;
    }
    let cancelled = false;
    const client = supabase;
    client.from("profiles").select("is_admin").eq("id", authUser.id).maybeSingle().then(({ data }) => {
      if (!cancelled) setIsAdmin(data?.is_admin === true);
    }, () => {
      if (!cancelled) setIsAdmin(false);
    });
    return () => { cancelled = true; };
  }, [authUser?.id]);

  useEffect(() => {
    const requestId = ++progressLoadRef.current;
    const storageKey = progressStorageKey(authUser?.id);
    const localProgress = readProgress(storageKey);
    const reviewKey = reviewStorageKey(authUser?.id);
    const localReview = readReviewStates(reviewKey);
    setReviewStates(localReview);
    if (!authUser || !supabase) {
      setSavedProgress(localProgress);
      return;
    }
    pendingProgressRef.current = readPendingProgress(authUser.id);
    setSavedProgress(localProgress);

    const client = supabase;
    let cancelled = false;
    async function loadCloudProgress() {
      const { data, error } = await client
        .from("user_progress")
        .select("unit_id, progress")
        .eq("user_id", authUser.id);

      if (cancelled || requestId !== progressLoadRef.current) return;
      if (error) {
        console.warn("Cloud progress could not be loaded; local progress remains active.", error.message);
        setSyncStatus(navigator.onLine ? "error" : "offline");
        return;
      }

      const cloudProgress = Object.fromEntries(
        ((data ?? []) as ProgressRow[]).map((row) => [row.unit_id, clampProgress(row.progress)]),
      ) as Record<number, number>;
      const mergedProgress = { ...localProgress };
      Object.entries(cloudProgress).forEach(([unitId, value]) => {
        const numericUnitId = Number(unitId);
        mergedProgress[numericUnitId] = Math.max(mergedProgress[numericUnitId] ?? 0, value);
      });

      setSavedProgress(mergedProgress);
      localStorage.setItem(storageKey, JSON.stringify(mergedProgress));

      const pendingRows = Object.entries(mergedProgress)
        .filter(([unitId, value]) => cloudProgress[Number(unitId)] !== value)
        .map(([unitId, value]) => ({
          user_id: authUser.id,
          unit_id: Number(unitId),
          progress: clampProgress(value),
          updated_at: new Date().toISOString(),
        }));

      if (pendingRows.length > 0) {
        pendingProgressRef.current = Object.fromEntries(pendingRows.map((row) => [row.unit_id, row.progress]));
        writePendingProgress(authUser.id, pendingProgressRef.current);
        setSyncStatus("syncing");
        const { error: syncError } = await client
          .from("user_progress")
          .upsert(pendingRows, { onConflict: "user_id,unit_id" });
        if (syncError) {
          console.warn("Local progress could not be synced.", syncError.message);
          setSyncStatus(navigator.onLine ? "error" : "offline");
        } else {
          pendingProgressRef.current = {};
          writePendingProgress(authUser.id, {});
          setSyncStatus("synced");
        }
      } else {
        setSyncStatus("synced");
      }
    }

    void loadCloudProgress();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  async function flushPendingProgress() {
    if (!authUser || !supabase) return;
    const pending = pendingProgressRef.current;
    const entries = Object.entries(pending);
    if (!entries.length) {
      setSyncStatus("synced");
      return;
    }
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    const client = supabase;
    const { error } = await client.from("user_progress").upsert(
      entries.map(([unitId, value]) => ({
        user_id: authUser.id,
        unit_id: Number(unitId),
        progress: clampProgress(value),
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,unit_id" },
    );
    if (error) {
      console.warn("Pending progress could not be synced.", error.message);
      setSyncStatus("error");
      return;
    }
    pendingProgressRef.current = {};
    writePendingProgress(authUser.id, {});
    setSyncStatus("synced");
  }

  useEffect(() => {
    if (!authUser) return;
    const onOnline = () => void flushPendingProgress();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [authUser?.id]);

  async function signOut() {
    await releaseDeviceSession();
    if (supabase) await supabase.auth.signOut();
    setShowAccountPanel(false);
    setAuthUser(null);
    setDeviceStatus("checking");
  }

  const activeUnit = allUnits.find((unit) => unit.id === activeUnitId) ?? allUnits[0];
  const lesson = lessonContent[activeUnit.id] ?? lessonContent[1];
  const visibleUnits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allUnits.filter((unit) => {
      const sectionMatch = activeSection === "all" || unit.section === activeSection;
      const queryMatch = !normalizedQuery || `${unit.title} ${unit.chinese} ${unit.tags.join(" ")}`.toLowerCase().includes(normalizedQuery);
      return sectionMatch && queryMatch;
    });
  }, [activeSection, query]);
  const progress = savedProgress[activeUnit.id] ?? activeUnit.progress;
  const completedUnits = allUnits.filter((unit) => (savedProgress[unit.id] ?? unit.progress) >= 100).length;
  const overallProgress = Math.round(allUnits.reduce((sum, unit) => sum + (savedProgress[unit.id] ?? unit.progress), 0) / allUnits.length);

  function updateUnitProgress(nextProgress: number) {
    const updatedProgress = clampProgress(Math.max(progress, nextProgress));
    if (updatedProgress === progress) return;

    const next = { ...savedProgress, [activeUnit.id]: updatedProgress };
    const storageKey = progressStorageKey(authUser?.id);
    setSavedProgress(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    ensureReviewScheduled(activeUnit.id);

    if (authUser && supabase) {
      pendingProgressRef.current = { ...pendingProgressRef.current, [activeUnit.id]: updatedProgress };
      writePendingProgress(authUser.id, pendingProgressRef.current);
      void flushPendingProgress();
      void recordActivity({
        userId: authUser.id,
        activityType: "progress_updated",
        unitId: activeUnit.id,
        metadata: { progress: updatedProgress },
      });
    }
  }

  function rateReview(unitId: number, rating: ReviewRating) {
    const nextState = applyReview(reviewStates[unitId], unitId, rating);
    const next = { ...reviewStates, [unitId]: nextState };
    setReviewStates(next);
    localStorage.setItem(reviewStorageKey(authUser?.id), JSON.stringify(next));
    if (authUser) {
      void recordActivity({
        userId: authUser.id,
        activityType: "progress_updated",
        unitId,
        metadata: { review_rating: rating, next_review_at: nextState.nextReviewAt },
      });
    }
  }

  function ensureReviewScheduled(unitId: number) {
    if (reviewStates[unitId]) return;
    const next = { ...reviewStates, [unitId]: createInitialReview(unitId) };
    setReviewStates(next);
    localStorage.setItem(reviewStorageKey(authUser?.id), JSON.stringify(next));
  }

  function startPractice() {
    setOpenModule("lesson");
    setActiveTab("practice");
    if (authUser) {
      void recordActivity({ userId: authUser.id, activityType: "practice_started", unitId: activeUnit.id });
    }
  }

  function startDialogue() {
    setOpenModule("lesson");
    setActiveTab("dialogue");
    if (authUser) {
      void recordActivity({ userId: authUser.id, activityType: "dialogue_started", unitId: activeUnit.id });
    }
  }

  function selectUnit(unit: Unit) {
    setViewMode("module");
    setOpenModule("lesson");
    setActiveUnitId(unit.id);
    setActiveTab("learn");
    setShowMobileMenu(false);
    if (authUser) {
      void recordActivity({
        userId: authUser.id,
        activityType: "unit_opened",
        unitId: unit.id,
        metadata: { title: unit.title },
      });
    }
    document.getElementById("lesson-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openLearningModule(section: string) {
    const firstUnit = section === "all" ? allUnits[0] : allUnits.find((unit) => unit.section === section);
    setActiveSection(section);
    if (firstUnit) setActiveUnitId(firstUnit.id);
    setActiveTab("learn");
    setViewMode("module");
    setShowMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const dueReviewCount = allUnits.filter((unit) => (savedProgress[unit.id] ?? unit.progress) > 0 && (!reviewStates[unit.id] || new Date(reviewStates[unit.id].nextReviewAt).getTime() <= Date.now())).length;

  function openModuleAndScroll(module: "review" | "lesson" | "curriculum") {
    setOpenModule(module);
    window.setTimeout(() => document.getElementById(`${module}-module`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    setShowMobileMenu(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${showMobileMenu ? "is-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Waves size={19} strokeWidth={2.6} /></div>
          <div><div className="brand-name">DOIT</div><div className="brand-caption">BUSINESS SPEAKING LAB</div></div>
          <button className="icon-button mobile-close" aria-label="关闭菜单" onClick={() => setShowMobileMenu(false)}><X size={18} /></button>
        </div>
        <nav className="primary-nav" aria-label="主导航">
           <button className={`nav-item ${viewMode === "overview" ? "active" : ""}`} onClick={() => { setViewMode("overview"); setShowMobileMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}><LayoutDashboard size={18} />Overview</button>
           <button className="nav-item" onClick={() => openLearningModule("all")}><BookOpen size={18} />Course modules</button>
          <button className="nav-item" onClick={() => setShowAudioPanel(true)}><Headphones size={18} />听力资源</button>
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-heading">按模块学习</div>
        <div className="section-nav">
          <button className={`section-item ${activeSection === "all" ? "selected" : ""}`} onClick={() => openLearningModule("all")}><span className="section-dot all-dot" />全部章节 <span className="section-count">20</span></button>
          {sections.map((section) => <button key={section.id} className={`section-item ${activeSection === section.title ? "selected" : ""}`} onClick={() => openLearningModule(section.title)}><span className="section-dot" />{section.title} <span className="section-count">4</span></button>)}
        </div>
        <div className="sidebar-footer">
           <button className="mini-goal" onClick={() => openLearningModule("all")}><div className="mini-goal-icon"><Sparkles size={16} /></div><div><strong>Daily goal</strong><span>{dueReviewCount > 0 ? `Due reviews: ${dueReviewCount}` : "Complete 1 speaking practice"}</span></div><ChevronRight size={14} /></button>

        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-trigger" onClick={() => setShowMobileMenu(true)} aria-label="打开菜单"><Waves size={20} /></button>
          <div className="breadcrumb"><span>学习总览</span><ChevronRight size={15} /><strong>Chapter {activeUnit.id}</strong></div>
          <div className="topbar-actions"><SyncStatus status={syncStatus} deviceStatus={deviceStatus} /><AudioTestButton /><VoicePicker /><PwaInstallButton />{isAdmin && <button className="account-button admin-trigger" onClick={() => setShowAdminPanel(true)}>Admin</button>}<button className="account-button" onClick={() => authUser ? setShowAccountPanel(true) : setShowAuthModal(true)}>{authUser ? "Account" : "Sign in"}</button><div className="topbar-avatar">{authUser ? (userToUsername(authUser)[0]?.toUpperCase() ?? "U") : "Y"}</div></div>
        </header>

        <div className={`page-container ${viewMode === "overview" ? "overview-page-container" : "module-page-container"}`}>
          {viewMode === "overview" ? <>
          <section className="hero-section">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" />你的商务英语口语路径</div>
              <h1>把每一次寒暄，<em>变成机会。</em></h1>
              <p>按《Collins English for Business: Speaking》章节学习，先听清楚，再说自然，最后在真实商务场景中用出来。</p>
              <div className="hero-actions"><button className="primary-button" onClick={() => { startPractice(); updateUnitProgress(70); }}><Play size={17} fill="currentColor" />继续 Unit {activeUnit.id}</button></div>
            </div>
            <div className="hero-stat-card"><div className="stat-card-top"><span>学习进度</span><span className="stat-label">B1–C2 · Business English</span></div><div className="big-progress"><strong>{overallProgress}%</strong><span>全书进度</span></div><div className="progress-track"><span style={{ width: `${overallProgress}%` }} /></div><div className="stat-foot"><span><Check size={14} /> {completedUnits} / 20 章节完成</span><span><Clock3 size={14} /> 每日 10 分钟</span></div></div>
          </section>

          <section className="focus-grid">
            <div className="section-card focus-card"><div className="card-kicker">继续学习 · Unit {activeUnit.id}</div><div className="focus-card-body"><div><h2>{activeUnit.title}</h2><p>{activeUnit.chinese} · {activeUnit.section}</p></div><div className="ring-progress" style={{ "--progress": `${progress * 3.6}deg` } as CSSProperties}><span>{progress}<small>%</small></span></div></div><div className="focus-card-footer"><span><Clock3 size={15} />约 12 分钟</span><button className="text-button" onClick={() => setActiveTab("learn")}>进入章节 <ArrowUpRight size={15} /></button></div></div>
            <div className="section-card streak-card"><div className="streak-icon"><Sparkles size={19} /></div><div><div className="card-kicker">学习节奏</div><h2>连续 3 天</h2><p>再坚持 4 天，解锁本周徽章</p></div><div className="streak-bars"><i /><i /><i /><i className="muted" /><i className="muted" /><i className="muted" /><i className="muted" /></div></div>
            <div className="section-card quick-card"><div className="quick-card-icon"><Mic size={19} /></div><div><div className="card-kicker">快速练习</div><h2>练一句就好</h2><p>用 60 秒复习当前章节的重点表达</p></div><button className="round-arrow" onClick={startPractice}><ArrowUpRight size={18} /></button></div>
          </section>

          <DashboardModule id="review-module" title="Spaced review" subtitle={dueReviewCount > 0 ? `${dueReviewCount} Units due today` : "Your review queue is clear"} icon={<Sparkles size={17} />} open={openModule === "review"} onToggle={() => setOpenModule((value) => value === "review" ? "lesson" : "review")}>
            <ReviewPanel units={allUnits} progress={savedProgress} states={reviewStates} onSelect={selectUnit} onRate={rateReview} />
          </DashboardModule>

          <DashboardModule id="lesson-module" title={`Current Unit ${activeUnit.id}`} subtitle={`${activeUnit.title} - ${activeTab === "learn" ? "Learn" : activeTab === "practice" ? "Practice" : "Dialogue"}`} icon={<BookOpen size={17} />} open={openModule === "lesson"} onToggle={() => setOpenModule((value) => value === "lesson" ? "review" : "lesson")}>
            <section id="lesson-workspace" className="workspace-grid">
              <div className="content-column">
                <div className="tabs-row"><div className="tabs"><button className={activeTab === "learn" ? "active" : ""} onClick={() => setActiveTab("learn")}>Learn</button><button className={activeTab === "practice" ? "active" : ""} onClick={startPractice}>Practice</button><button className={activeTab === "dialogue" ? "active" : ""} onClick={startDialogue}>Dialogue</button></div><span className="source-badge"><span />20 Units loaded</span></div>
                {activeTab === "learn" && <LearnPanel unit={activeUnit} lesson={lesson} onSpeak={() => speak(activeUnit.title)} onProgress={updateUnitProgress} onPractice={startPractice} />}
                {activeTab === "practice" && <PracticePanel unit={activeUnit} target={lesson.expressions[0].english} userId={authUser?.id} onProgress={updateUnitProgress} />}
                {activeTab === "dialogue" && <DialoguePanel unit={activeUnit} lesson={lesson} userId={authUser?.id} onProgress={updateUnitProgress} />}
              </div>
              <aside className="right-column"><div className="section-card pronunciation-card"><div className="card-title-row"><div><div className="card-kicker">Pronunciation focus</div><h3>{activeUnit.id === 1 ? "Connected speech" : "Professional tone"}</h3></div><Volume2 size={19} className="green-icon" /></div><div className="pronunciation-example"><span>{lesson.expressions[0].english}</span><button onClick={() => speak(lesson.expressions[0].english)} aria-label="Play example"><Volume2 size={16} /></button></div><p>Listen to the example, then record your version. Feedback is practice support rather than a professional assessment.</p><button className="outline-button" onClick={startPractice}>Start shadowing <ChevronRight size={15} /></button></div><div className="section-card resource-card"><div className="card-title-row"><div><div className="card-kicker">Learning resources</div><h3>Audio resources</h3></div><Headphones size={19} className="green-icon" /></div><div className="resource-status"><span className="status-dot warning" /><div><strong>Official source available</strong><span>The site does not redistribute book audio.</span></div></div><button className="text-button" onClick={() => setShowAudioPanel(true)}>View sources <ArrowUpRight size={15} /></button></div></aside>
            </section>
          </DashboardModule>

          <DashboardModule id="curriculum-module" title="Course map" subtitle="20 business scenarios" icon={<LayoutDashboard size={17} />} open={openModule === "curriculum"} onToggle={() => setOpenModule((value) => value === "curriculum" ? "lesson" : "curriculum")}>
            <section id="curriculum" className="curriculum-section"><div className="section-heading-row"><div><div className="eyebrow">COURSE MAP</div><h2>20 business scenarios</h2><p>Search the curriculum and choose the next Unit you want to practice.</p></div><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Units or topics" /></div></div><div className="unit-list">{visibleUnits.map((unit) => <UnitListItem key={unit.id} unit={unit} active={unit.id === activeUnitId} progress={savedProgress[unit.id] ?? unit.progress} onClick={() => selectUnit(unit)} />)}</div></section>
          </DashboardModule>
          </> : <ModuleLearningView
            activeUnit={activeUnit}
            lesson={lesson}
            activeSection={activeSection}
            activeTab={activeTab}
            moduleUnits={allUnits.filter((unit) => activeSection === "all" || unit.section === activeSection)}
            savedProgress={savedProgress}
            onBack={() => { setViewMode("overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            onSelectUnit={selectUnit}
            onTabChange={setActiveTab}
            onPractice={startPractice}
            onProgress={updateUnitProgress}
            userId={authUser?.id}
            onSpeak={(text) => speak(text)}
          />}
          <footer className="site-footer"><span>© 2026 LingoDesk · 个人学习工具原型</span><span>仅用于个人学习；版权内容不在本站重新分发。</span></footer>
        </div>
      </main>
      {showAudioPanel && <AudioPanel onClose={() => setShowAudioPanel(false)} />}
      {showAdminPanel && isAdmin && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      {showAccountPanel && authUser && <AccountPanel username={userToUsername(authUser) || "Learner"} onClose={() => setShowAccountPanel(false)} onSignOut={signOut} />}
      {showAuthModal && <AuthModal required={isSupabaseConfigured && !authUser} onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

function ModuleLearningView({ activeUnit, lesson, activeSection, activeTab, moduleUnits, savedProgress, onBack, onSelectUnit, onTabChange, onPractice, onProgress, userId, onSpeak }: { activeUnit: Unit; lesson: LessonContent; activeSection: string; activeTab: "learn" | "practice" | "dialogue"; moduleUnits: Unit[]; savedProgress: Record<number, number>; onBack: () => void; onSelectUnit: (unit: Unit) => void; onTabChange: (tab: "learn" | "practice" | "dialogue") => void; onPractice: () => void; onProgress: (progress: number) => void; userId?: string; onSpeak: (text: string) => void }) {
  const sectionTitle = activeSection === "all" ? "All chapters" : activeSection;
  return <section className="module-learning-view">
    <div className="module-learning-header"><div><button className="back-to-overview" onClick={onBack}><ChevronRight size={15} />Back to overview</button><div className="eyebrow">LEARNING MODULE</div><h1>{sectionTitle}</h1><p>Choose a Unit from the switcher, then focus on one lesson at a time.</p></div><div className="module-learning-count"><strong>{moduleUnits.length}</strong><span>Units</span></div></div>
    <div className="module-unit-switcher" role="tablist" aria-label={`${sectionTitle} Units`}>{moduleUnits.map((unit) => <button key={unit.id} role="tab" aria-selected={unit.id === activeUnit.id} className={`module-unit-switch ${unit.id === activeUnit.id ? "active" : ""}`} onClick={() => onSelectUnit(unit)}><span className="module-unit-number">{String(unit.id).padStart(2, "0")}</span><span><strong>{unit.title}</strong><small>{unit.chinese} ? {savedProgress[unit.id] ?? unit.progress}%</small></span></button>)}</div>
    <div className="module-lesson-content"><div className="tabs-row module-tabs"><div className="tabs"><button className={activeTab === "learn" ? "active" : ""} onClick={() => onTabChange("learn")}>Learn</button><button className={activeTab === "practice" ? "active" : ""} onClick={onPractice}>Practice</button><button className={activeTab === "dialogue" ? "active" : ""} onClick={() => onTabChange("dialogue")}>Dialogue</button></div><span className="source-badge">Unit {activeUnit.id} ? {savedProgress[activeUnit.id] ?? activeUnit.progress}%</span></div>{activeTab === "learn" && <LearnPanel unit={activeUnit} lesson={lesson} onSpeak={() => onSpeak(activeUnit.title)} onProgress={onProgress} onPractice={onPractice} />}{activeTab === "practice" && <PracticePanel unit={activeUnit} target={lesson.expressions[0].english} userId={userId} onProgress={onProgress} />}{activeTab === "dialogue" && <DialoguePanel unit={activeUnit} lesson={lesson} userId={userId} onProgress={onProgress} />}</div>
  </section>;
}

function DashboardModule({ id, title, subtitle, icon, open, onToggle, children }: { id: string; title: string; subtitle: string; icon: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return <section id={id} className={`dashboard-module ${open ? "is-open" : "is-collapsed"}`}>
    <button className="dashboard-module-trigger" onClick={onToggle} aria-expanded={open}><span className="dashboard-module-icon">{icon}</span><span className="dashboard-module-copy"><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight size={17} /></button>
    {open && <div className="dashboard-module-content">{children}</div>}
  </section>;
}

function SyncStatus({ status, deviceStatus }: { status: "idle" | "syncing" | "synced" | "offline" | "error"; deviceStatus: "checking" | "active" | "offline" | "revoked" | "error" }) {
  const text = deviceStatus === "revoked" ? "Signed out on another device" : deviceStatus === "offline" || status === "offline" ? "Offline - saved locally" : status === "syncing" ? "Syncing..." : status === "error" || deviceStatus === "error" ? "Sync issue" : status === "synced" ? "Synced" : "Cloud ready";
  const className = deviceStatus === "revoked" || status === "error" || deviceStatus === "error" ? "error" : deviceStatus === "offline" || status === "offline" ? "offline" : status === "syncing" ? "syncing" : "synced";
  return <span className={`sync-status ${className}`} title={text}><span />{text}</span>;
}

function LearnPanel({ unit, lesson, onSpeak, onProgress, onPractice }: { unit: Unit; lesson: LessonContent; onSpeak: () => void; onProgress: (progress: number) => void; onPractice: () => void }) {
  const [openSection, setOpenSection] = useState<"expressions" | "coach" | "exercise" | "audio">("expressions");
  const [showAnswer, setShowAnswer] = useState(false);
  const exercise = lesson.exercise;
  const enrichment = lessonEnrichment[unit.id];
  const toggle = (section: "expressions" | "coach" | "exercise" | "audio") => setOpenSection((current) => current === section ? "expressions" : section);

  return <div className="section-card learn-panel">
    <div className="panel-heading"><div><div className="card-kicker">UNIT {String(unit.id).padStart(2, "0")} - {unit.title.toUpperCase()}</div><h2>{unit.chinese}: Make the scenario clear</h2></div><button className="round-play" onClick={onSpeak}><Volume2 size={19} /></button></div>
    <div className="lesson-intro"><div className="lesson-number">{String(unit.id).padStart(2, "0")}</div><div><p>{lesson.focus}</p><div className="tag-row">{unit.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div>
    <div className="learn-folds">
      <CollapsibleSection eyebrow="KEY EXPRESSIONS" title={`${lesson.expressions.length} key expressions`} open={openSection === "expressions"} onToggle={() => toggle("expressions")}><div className="expression-grid">{lesson.expressions.map((item) => <div className="expression-item" key={item.english}><button className="tiny-play" onClick={() => speak(item.english)}><Play size={12} fill="currentColor" /></button><div><strong>{item.english}</strong><span>{item.chinese}</span><small>{item.note}</small></div></div>)}</div></CollapsibleSection>
      <CollapsibleSection eyebrow="COACH NOTES" title="Speak more naturally" open={openSection === "coach"} onToggle={() => toggle("coach")}>
        <div className="coach-module"><div className="coach-goal"><strong>Communication goal</strong><span>{enrichment.goal}</span></div><div className="coach-patterns">{enrichment.patterns.map((pattern) => <div className="coach-pattern" key={pattern.phrase}><strong>{pattern.phrase}</strong><span>{pattern.use}</span></div>)}</div><div className="coach-drill"><span>30-second drill</span><strong>{enrichment.drill}</strong></div><div className="coach-watch"><strong>Watch for</strong><span>{enrichment.watchFor}</span></div><div className="coach-check"><strong>Self-check</strong>{enrichment.selfCheck.map((item) => <span key={item}>- {item}</span>)}</div></div>
      </CollapsibleSection>
      <CollapsibleSection eyebrow="CHAPTER PRACTICE" title="Practice exercise" open={openSection === "exercise"} onToggle={() => toggle("exercise")}><div className="exercise-card"><div className="exercise-top"><div><div className="card-kicker">CHAPTER PRACTICE - PRACTICE</div><h3>{exercise.prompt}</h3></div><span className="exercise-type">{exercise.type === "choose" ? "Choose" : exercise.type === "rewrite" ? "Rewrite" : "Speak"}</span></div>{exercise.options && <div className="exercise-options">{exercise.options.map((option) => <button key={option} className={showAnswer && option === exercise.answer ? "correct" : ""} onClick={() => setShowAnswer(true)}>{option}</button>)}</div>}{!exercise.options && <button className="secondary-button compact exercise-reveal" onClick={() => setShowAnswer((value) => !value)}>{showAnswer ? "Hide answer" : "Show answer"}</button>}{showAnswer && <div className="exercise-answer"><Check size={15} /><div><strong>{exercise.answer}</strong><span>{exercise.explanation}</span></div></div>}</div></CollapsibleSection>
      <CollapsibleSection eyebrow="OPTIONAL AUDIO" title="Local audio" open={openSection === "audio"} onToggle={() => toggle("audio")}><LocalAudioPlayer unit={unit} /></CollapsibleSection>
    </div>
    <div className="panel-footer"><span><BookOpen size={15} />Source page {unit.page}</span><button className="primary-button compact" onClick={() => { onProgress(70); onPractice(); }}>Start shadowing <ArrowUpRight size={15} /></button></div>
  </div>;
}

function LocalAudioPlayer({ unit }: { unit: Unit }) {
  const [audioUrl, setAudioUrl] = useState("");
  const [fileName, setFileName] = useState("");
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  function chooseAudio(file?: File) {
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setFileName(file.name);
  }
  return <div className="local-audio-slot"><div><div className="card-kicker">OPTIONAL AUDIO · 本地正版音频</div><strong>{fileName || `Unit ${unit.id} 暂未选择本地 MP3`}</strong><span>选择你拥有授权的 MP3，只在当前浏览器本地播放，不会上传。</span></div>{audioUrl ? <audio controls src={audioUrl} /> : <label className="audio-upload-button"><Headphones size={15} />选择音频<input type="file" accept="audio/*" onChange={(event) => chooseAudio(event.target.files?.[0])} /></label>}</div>;
}

function PracticePanel({ unit, target, userId, onProgress }: { unit: Unit; target: string; userId?: string; onProgress: (progress: number) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<string[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  function toggleRecording() {
    const speechWindow = window as WindowWithSpeech;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!isRecording) {
      if (!Recognition) { setFeedback(["当前浏览器没有开放语音识别接口。你仍可以播放示范并手动复述。"]); return; }
      const recognition = new Recognition();
      recognition.lang = "en-US"; recognition.continuous = false; recognition.interimResults = false;
      recognition.onresult = (event) => { const text = event.results[0][0].transcript; setTranscript(text); setFeedback(compareSpeech(target, text)); onProgress(82); };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => { setIsRecording(false); setFeedback(["没有捕捉到清晰语音，请靠近麦克风并再试一次。"]); };
      recognitionRef.current = recognition; recognition.start(); setIsRecording(true); setFeedback([]);
    } else { recognitionRef.current?.stop(); setIsRecording(false); }
  }
  return <div className="section-card practice-panel"><div className="panel-heading"><div><div className="card-kicker">SHADOWING · UNIT {String(unit.id).padStart(2, "0")}</div><h2>跟着示范，说出你的版本</h2></div><span className="practice-status"><span />浏览器语音识别</span></div><div className="target-sentence"><div className="sentence-label">TARGET SENTENCE</div><div className="sentence-text">{target}</div><div className="sentence-actions"><button className="audio-action" onClick={() => speak(target)}><Volume2 size={16} />播放示范</button><span>建议：先慢速、再自然语速</span></div></div><div className="record-zone"><button className={`record-button ${isRecording ? "recording" : ""}`} onClick={toggleRecording}>{isRecording ? <Pause size={25} fill="currentColor" /> : <Mic size={25} />}</button><strong>{isRecording ? "正在聆听…" : "点击开始录音"}</strong><span>{isRecording ? "说完后会自动停止" : "允许麦克风权限后开始"}</span></div>{transcript && <div className="transcript-box"><div><span className="card-kicker">你的识别结果</span><p>{transcript}</p></div><button className="icon-button" onClick={() => { setTranscript(""); setFeedback([]); }} aria-label="清除"><RotateCcw size={16} /></button></div>}{feedback.length > 0 && <div className="feedback-box"><div className="feedback-title"><Sparkles size={16} />即时反馈</div>{feedback.map((item) => <div key={item} className="feedback-line"><Check size={15} />{item}</div>)}</div>}<div className="panel-footer"><span><Waves size={15} />发音反馈是辅助练习，不等同于专业测评</span><button className="secondary-button compact" onClick={() => onProgress(90)}>标记本次完成 <Check size={15} /></button></div></div>;
}

function DialoguePanel({ unit, lesson, userId, onProgress }: { unit: Unit; lesson: LessonContent; userId?: string; onProgress: (progress: number) => void }) {
  const [step, setStep] = useState(0);
  const messages = lesson.dialogue.messages;
  return <div className="section-card dialogue-panel"><div className="panel-heading"><div><div className="card-kicker">ROLEPLAY · UNIT {String(unit.id).padStart(2, "0")}</div><h2>{lesson.dialogue.scenario}</h2></div><span className="dialogue-progress">{Math.min(step + 1, messages.length)} / {messages.length}</span></div><div className="scenario-note"><Sparkles size={16} /><span>提示：{lesson.dialogue.hint}</span></div><div className="chat-thread">{messages.slice(0, step + 1).map((message, index) => <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}><div className="chat-avatar">{message.role === "coach" ? "A" : "你"}</div><div><span>{message.name}</span><p>{message.text}</p></div></div>)}</div><div className="dialogue-actions">{step < messages.length - 1 ? <button className="primary-button" onClick={() => { setStep(step + 1); onProgress(96); }}><Mic size={17} />说出下一句</button> : <button className="primary-button" onClick={() => onProgress(100)}><Check size={17} />完成本次对话</button>}<button className="secondary-button" onClick={() => setStep(0)}><RotateCcw size={16} />重新开始</button></div></div>;
}

function UnitListItem({ unit, active, progress, onClick }: { unit: Unit; active: boolean; progress: number; onClick: () => void }) {
  return <button className={`unit-list-item ${active ? "active" : ""}`} onClick={onClick}><span className="unit-index">{String(unit.id).padStart(2, "0")}</span><span className="unit-main"><strong>{unit.title}</strong><span>{unit.chinese} · {unit.section}</span><div className="unit-tags">{unit.tags.map((tag) => <i key={tag}>{tag}</i>)}</div></span><span className="unit-progress"><span className="tiny-track"><i style={{ width: `${progress}%` }} /></span><small>{progress}%</small></span><ChevronRight size={17} className="unit-arrow" /></button>;
}

function AudioPanel({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="audio-modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="card-kicker">AUDIO CHECK · 音频核验</div><h2>书籍听力资源</h2><p>官方入口已加入；第三方页面只作为线索外链。本站不下载、不复制、不重新分发原书 CD 音频。</p></div><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={19} /></button></div><div className="verified-banner"><Check size={17} /><div><strong>已核验的信息</strong><span>中文注释版 ISBN 978-7-100-10345-9 · 原版 ISBN 978-0-00-742323-1 · 全书 20 个 Unit</span></div></div><div className="audio-source-list">{audioSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="audio-source"><div className="source-icon"><Headphones size={17} /></div><div><strong>{source.label}<span className={`source-kind ${source.kind === "官方入口" ? "official" : "third-party"}`}>{source.kind}</span></strong><span>{source.note}</span></div><ArrowUpRight size={16} /></a>)}</div><div className="modal-note"><LockKeyhole size={15} />版权说明：课程索引和练习为学习辅助；正版 MP3 可用章节页的本地播放器播放，但文件不会上传。</div></div></div>;
}

function compareSpeech(target: string, transcript: string) {
  const targetWords = target.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/);
  const spokenWords = transcript.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/);
  const missing = targetWords.filter((word) => !spokenWords.includes(word));
  const ratio = Math.max(0, Math.round(((targetWords.length - missing.length) / targetWords.length) * 100));
  if (ratio >= 90) return ["句子基本完整，节奏可以再自然一点。", "重点关注句尾重音和清晰度。"];
  if (ratio >= 65) return [`表达完成度约 ${ratio}%，建议补上：${missing.slice(0, 3).join(", ") || "句尾内容"}。`, "先分成两段练习，再合并成完整句子。"];
  return [`识别到的内容与目标句差异较大（约 ${ratio}%）。`, "请先播放示范，放慢速度并逐词跟读。"];
}

function speak(text: string) {
  speakEnglish(text);
}

export default App;
