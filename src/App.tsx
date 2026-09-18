import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
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

const STORAGE_KEY = "business-speaking-progress-v1";

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
  const [savedProgress, setSavedProgress] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    const next = { ...savedProgress, [activeUnit.id]: Math.max(progress, nextProgress) };
    setSavedProgress(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function selectUnit(unit: Unit) {
    setActiveUnitId(unit.id);
    setActiveTab("learn");
    setShowMobileMenu(false);
    document.getElementById("lesson-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${showMobileMenu ? "is-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Waves size={19} strokeWidth={2.6} /></div>
          <div><div className="brand-name">LingoDesk</div><div className="brand-caption">BUSINESS SPEAKING LAB</div></div>
          <button className="icon-button mobile-close" aria-label="关闭菜单" onClick={() => setShowMobileMenu(false)}><X size={18} /></button>
        </div>
        <nav className="primary-nav" aria-label="主导航">
          <button className="nav-item active"><LayoutDashboard size={18} />学习总览</button>
          <button className="nav-item" onClick={() => document.getElementById("curriculum")?.scrollIntoView({ behavior: "smooth" })}><BookOpen size={18} />课程章节</button>
          <button className="nav-item" onClick={() => setShowAudioPanel(true)}><Headphones size={18} />听力资源</button>
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-heading">按模块学习</div>
        <div className="section-nav">
          <button className={`section-item ${activeSection === "all" ? "selected" : ""}`} onClick={() => setActiveSection("all")}><span className="section-dot all-dot" />全部章节 <span className="section-count">20</span></button>
          {sections.map((section) => <button key={section.id} className={`section-item ${activeSection === section.title ? "selected" : ""}`} onClick={() => setActiveSection(section.title)}><span className="section-dot" />{section.title} <span className="section-count">4</span></button>)}
        </div>
        <div className="sidebar-footer">
          <div className="mini-goal"><div className="mini-goal-icon"><Sparkles size={16} /></div><div><strong>今日目标</strong><span>完成 1 个口语练习</span></div></div>
          <div className="user-chip"><div className="avatar">Y</div><div><strong>你的学习空间</strong><span>本地进度已保存</span></div><ChevronRight size={16} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-trigger" onClick={() => setShowMobileMenu(true)} aria-label="打开菜单"><Waves size={20} /></button>
          <div className="breadcrumb"><span>学习总览</span><ChevronRight size={15} /><strong>Chapter {activeUnit.id}</strong></div>
          <div className="topbar-actions"><button className="help-button"><CircleHelp size={17} />使用帮助</button><div className="topbar-avatar">Y</div></div>
        </header>

        <div className="page-container">
          <section className="hero-section">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" />你的商务英语口语路径</div>
              <h1>把每一次寒暄，<em>变成机会。</em></h1>
              <p>按《Collins English for Business: Speaking》章节学习，先听清楚，再说自然，最后在真实商务场景中用出来。</p>
              <div className="hero-actions"><button className="primary-button" onClick={() => { setActiveTab("practice"); updateUnitProgress(70); }}><Play size={17} fill="currentColor" />继续 Unit {activeUnit.id}</button><button className="secondary-button" onClick={() => setShowAudioPanel(true)}><Headphones size={17} />查看听力资源</button></div>
            </div>
            <div className="hero-stat-card"><div className="stat-card-top"><span>学习进度</span><span className="stat-label">B1–C2 · Business English</span></div><div className="big-progress"><strong>{overallProgress}%</strong><span>全书进度</span></div><div className="progress-track"><span style={{ width: `${overallProgress}%` }} /></div><div className="stat-foot"><span><Check size={14} /> {completedUnits} / 20 章节完成</span><span><Clock3 size={14} /> 每日 10 分钟</span></div></div>
          </section>

          <section className="focus-grid">
            <div className="section-card focus-card"><div className="card-kicker">继续学习 · Unit {activeUnit.id}</div><div className="focus-card-body"><div><h2>{activeUnit.title}</h2><p>{activeUnit.chinese} · {activeUnit.section}</p></div><div className="ring-progress" style={{ "--progress": `${progress * 3.6}deg` } as CSSProperties}><span>{progress}<small>%</small></span></div></div><div className="focus-card-footer"><span><Clock3 size={15} />约 12 分钟</span><button className="text-button" onClick={() => setActiveTab("learn")}>进入章节 <ArrowUpRight size={15} /></button></div></div>
            <div className="section-card streak-card"><div className="streak-icon"><Sparkles size={19} /></div><div><div className="card-kicker">学习节奏</div><h2>连续 3 天</h2><p>再坚持 4 天，解锁本周徽章</p></div><div className="streak-bars"><i /><i /><i /><i className="muted" /><i className="muted" /><i className="muted" /><i className="muted" /></div></div>
            <div className="section-card quick-card"><div className="quick-card-icon"><Mic size={19} /></div><div><div className="card-kicker">快速练习</div><h2>练一句就好</h2><p>用 60 秒复习当前章节的重点表达</p></div><button className="round-arrow" onClick={() => setActiveTab("practice")}><ArrowUpRight size={18} /></button></div>
          </section>

          <section id="lesson-workspace" className="workspace-grid">
            <div className="content-column">
              <div className="tabs-row"><div className="tabs"><button className={activeTab === "learn" ? "active" : ""} onClick={() => setActiveTab("learn")}>章节学习</button><button className={activeTab === "practice" ? "active" : ""} onClick={() => setActiveTab("practice")}>跟读练习</button><button className={activeTab === "dialogue" ? "active" : ""} onClick={() => setActiveTab("dialogue")}>互动对话</button></div><span className="source-badge"><span />20 个 Unit 已录入</span></div>
              {activeTab === "learn" && <LearnPanel unit={activeUnit} lesson={lesson} onSpeak={() => speak(activeUnit.title)} onProgress={updateUnitProgress} onPractice={() => setActiveTab("practice")} />}
              {activeTab === "practice" && <PracticePanel unit={activeUnit} target={lesson.expressions[0].english} onProgress={updateUnitProgress} />}
              {activeTab === "dialogue" && <DialoguePanel unit={activeUnit} lesson={lesson} onProgress={updateUnitProgress} />}
            </div>
            <aside className="right-column"><div className="section-card pronunciation-card"><div className="card-title-row"><div><div className="card-kicker">当前章节发音焦点</div><h3>{activeUnit.id === 1 ? "连读 · Connected speech" : "商务语气 · Professional tone"}</h3></div><Volume2 size={19} className="green-icon" /></div><div className="pronunciation-example"><span>{lesson.expressions[0].english}</span><button onClick={() => speak(lesson.expressions[0].english)} aria-label="播放示范"><Volume2 size={16} /></button></div><p>先听示范，再录下自己的版本。识别结果用于辅助纠正完整度、节奏与重点表达，不等同于专业发音测评。</p><button className="outline-button" onClick={() => setActiveTab("practice")}>开始模仿 <ChevronRight size={15} /></button></div><div className="section-card resource-card"><div className="card-title-row"><div><div className="card-kicker">学习资料</div><h3>听力资源状态</h3></div><Headphones size={19} className="green-icon" /></div><div className="resource-status"><span className="status-dot warning" /><div><strong>官方入口已确认</strong><span>原书标注 included CD；本站不转载音频文件</span></div></div><button className="text-button" onClick={() => setShowAudioPanel(true)}>查看来源与说明 <ArrowUpRight size={15} /></button></div></aside>
          </section>

          <section id="curriculum" className="curriculum-section"><div className="section-heading-row"><div><div className="eyebrow">COURSE MAP · 课程地图</div><h2>20 个真实商务场景</h2><p>从建立联系到面试沟通，重点表达、互动脚本和练习已按章节录入。</p></div><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索章节或主题" /></div></div><div className="unit-list">{visibleUnits.map((unit) => <UnitListItem key={unit.id} unit={unit} active={unit.id === activeUnitId} progress={savedProgress[unit.id] ?? unit.progress} onClick={() => selectUnit(unit)} />)}</div></section>
          <footer className="site-footer"><span>© 2026 LingoDesk · 个人学习工具原型</span><span>仅用于个人学习；版权内容不在本站重新分发。</span></footer>
        </div>
      </main>
      {showAudioPanel && <AudioPanel onClose={() => setShowAudioPanel(false)} />}
    </div>
  );
}

function LearnPanel({ unit, lesson, onSpeak, onProgress, onPractice }: { unit: Unit; lesson: LessonContent; onSpeak: () => void; onProgress: (progress: number) => void; onPractice: () => void }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const exercise = lesson.exercise;
  return <div className="section-card learn-panel"><div className="panel-heading"><div><div className="card-kicker">UNIT {String(unit.id).padStart(2, "0")} · {unit.title.toUpperCase()}</div><h2>{unit.chinese}：把场景说清楚</h2></div><button className="round-play" onClick={onSpeak}><Volume2 size={19} /></button></div><div className="lesson-intro"><div className="lesson-number">{String(unit.id).padStart(2, "0")}</div><div><p>{lesson.focus}</p><div className="tag-row">{unit.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div><div className="expression-grid">{lesson.expressions.map((item) => <div className="expression-item" key={item.english}><button className="tiny-play" onClick={() => speak(item.english)}><Play size={12} fill="currentColor" /></button><div><strong>{item.english}</strong><span>{item.chinese}</span><small>{item.note}</small></div></div>)}</div><div className="exercise-card"><div className="exercise-top"><div><div className="card-kicker">CHAPTER PRACTICE · 章节练习</div><h3>{exercise.prompt}</h3></div><span className="exercise-type">{exercise.type === "choose" ? "选择" : exercise.type === "rewrite" ? "改写" : "口语"}</span></div>{exercise.options && <div className="exercise-options">{exercise.options.map((option) => <button key={option} className={showAnswer && option === exercise.answer ? "correct" : ""} onClick={() => setShowAnswer(true)}>{option}</button>)}</div>}{!exercise.options && <button className="secondary-button compact exercise-reveal" onClick={() => setShowAnswer((value) => !value)}>{showAnswer ? "收起参考表达" : "查看参考表达"}</button>}{showAnswer && <div className="exercise-answer"><Check size={15} /><div><strong>{exercise.answer}</strong><span>{exercise.explanation}</span></div></div>}</div><LocalAudioPlayer unit={unit} /><div className="panel-footer"><span><BookOpen size={15} />书中原章节：第 {unit.page} 页起</span><button className="primary-button compact" onClick={() => { onProgress(70); onPractice(); }}>进入跟读练习 <ArrowUpRight size={15} /></button></div></div>;
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

function PracticePanel({ unit, target, onProgress }: { unit: Unit; target: string; onProgress: (progress: number) => void }) {
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

function DialoguePanel({ unit, lesson, onProgress }: { unit: Unit; lesson: LessonContent; onProgress: (progress: number) => void }) {
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
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US"; utterance.rate = 0.86; window.speechSynthesis.speak(utterance);
}

export default App;
