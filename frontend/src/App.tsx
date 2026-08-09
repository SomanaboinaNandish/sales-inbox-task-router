import React, { useState, useEffect, useRef } from 'react';
import {
  Inbox,
  CheckCircle,
  MessageSquare,
  Settings,
  AlertTriangle,
  Send,
  RefreshCw,
  User,
  ChevronDown,
  ChevronUp,
  Terminal,
  Clock
} from 'lucide-react';
import { generateSampleEmails } from './sampleData';
import type { Email } from './sampleData';

interface Task {
  task_id: string;
  candidate_id: string;
  source_email_id: string;
  thread_id: string;
  title: string;
  description: string;
  assignee_id: string;
  category: string;
  priority: string;
  due_date: string | null;
  deal_value_inr: number | null;
  company_name: string | null;
  confidence: number;
  created_at: string;
  from_name?: string;
  from_email?: string;
  subject?: string;
  received_at?: string;
  decision_reasoning?: string;
}

interface ChatMessage {
  sender: 'user' | 'assistant' | 'system';
  text: string;
  supportingData?: any;
  showData?: boolean;
}

export default function App() {
  // Configuration State
  const [candidateId, setCandidateId] = useState('priya.sharma@gmail.com');
  const [backendUrl, setBackendUrl] = useState('http://localhost:5000');
  const [showConfig, setShowConfig] = useState(false);

  // Ingestion State
  const [jsonInput, setJsonInput] = useState('');
  const [rawEmails, setRawEmails] = useState<Email[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Processing State
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSummary, setIngestSummary] = useState<any | null>(null);

  // Data list & statistics State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'all-emails'>('tasks');

  // Detailed Modal/Pane State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Automatically parse text area JSON
  useEffect(() => {
    if (!jsonInput.trim()) {
      setRawEmails([]);
      setParseError(null);
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        setRawEmails(parsed);
        setParseError(null);
      } else if (parsed.emails && Array.isArray(parsed.emails)) {
        setRawEmails(parsed.emails);
        setParseError(null);
      } else {
        setRawEmails([]);
        setParseError('JSON must be an array of emails or an object with an "emails" array.');
      }
    } catch (err: any) {
      setRawEmails([]);
      setParseError(`Invalid JSON syntax: ${err.message}`);
    }
  }, [jsonInput]);

  // Load stats and tasks on init
  useEffect(() => {
    fetchStatsAndTasks();
  }, [candidateId, backendUrl]);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const fetchStatsAndTasks = async () => {
    if (!candidateId.trim()) return;
    try {
      // 1. Fetch tasks
      const tasksRes = await fetch(`${backendUrl}/api/tasks?candidate_id=${encodeURIComponent(candidateId.trim())}`);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      // 2. Fetch stats
      const statsRes = await fetch(`${backendUrl}/api/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to fetch updates from backend:", err);
    }
  };

  const handleGenerateSample = () => {
    const samples = generateSampleEmails();
    const formattedJson = JSON.stringify(samples, null, 2);
    setJsonInput(formattedJson);
  };

  const handleIngest = async () => {
    if (rawEmails.length === 0) return;
    setIsIngesting(true);
    setIngestSummary(null);

    const payload = {
      candidate_id: candidateId.trim(),
      emails: rawEmails
    };

    try {
      const response = await fetch(`${backendUrl}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || response.statusText);
      }

      const result = await response.json();
      setIngestSummary(result);
      
      // Add system announcement to chat history
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'system',
          text: `Routed batch successfully: processed ${result.processed} email(s). Tasks created: ${result.tasks_created}, Tasks updated: ${result.tasks_updated}, Skipped (Spam/OOO): ${result.skipped}.`
        }
      ]);

      // Refresh stats and tasks list
      await fetchStatsAndTasks();
      // Clear input after ingestion
      setJsonInput('');
    } catch (err: any) {
      console.error("Ingestion failed:", err);
      setChatHistory(prev => [
        ...prev,
        { sender: 'system', text: `Ingestion error: ${err.message}` }
      ]);
      alert(`Ingestion failed: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const queryText = chatInput.trim();
    setChatInput('');
    
    // Add user message
    setChatHistory(prev => [...prev, { sender: 'user', text: queryText }]);
    setIsChatLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId.trim(),
          query: queryText
        })
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const data = await response.json();
      
      // Add assistant response
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: data.answer,
          supportingData: data.supporting_data,
          showData: false
        }
      ]);
    } catch (err: any) {
      console.error("Chat request failed:", err);
      setChatHistory(prev => [
        ...prev,
        { sender: 'system', text: `Chat Error: ${err.message}` }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const toggleSupportingData = (index: number) => {
    setChatHistory(prev =>
      prev.map((msg, i) => (i === index ? { ...msg, showData: !msg.showData } : msg))
    );
  };

  // Format currency helper
  const formatCurrency = (val: number | null) => {
    if (val === null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // UI mapping helpers
  const getAssigneeName = (id: string) => {
    const mapping: Record<string, string> = {
      u_aarti: 'Aarti Menon',
      u_rohit: 'Rohit Sharma',
      u_meera: 'Meera Iyer',
      u_karan: 'Karan Doshi',
      u_divya: 'Divya Rao',
      u_triage: 'Triage Queue'
    };
    return mapping[id] || id;
  };

  const getCategoryLabel = (cat: string) => {
    return cat.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="app-container">
      {/* 1. Header Section */}
      <header className="app-header glass-panel glowing">
        <div className="header-title-area">
          <div className="logo-icon">
            <Inbox className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="app-title">Sales Inbox Task Router</h1>
            <p className="app-subtitle">Autonomous routing, validation, & chat console</p>
          </div>
        </div>
        <div className="header-meta">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Settings className="w-4 h-4" />
            Config
          </button>
          <div className="badge candidate">
            <User className="w-4 h-4" />
            ID: {candidateId}
          </div>
          <div className="badge connected">
            <Clock className="w-4 h-4" />
            IST Live
          </div>
        </div>
      </header>

      {/* Configuration Dropdown */}
      {showConfig && (
        <div className="glass-panel" style={{ borderTop: 'none', marginTop: '-1.5rem', zIndex: 10 }}>
          <div className="config-header" onClick={() => setShowConfig(false)}>
            <span style={{ fontWeight: 600 }}>System Configuration</span>
            <ChevronUp className="w-4 h-4" />
          </div>
          <div className="config-body">
            <div className="form-group">
              <label className="form-label">Candidate ID (Email Address)</label>
              <input
                type="text"
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="text-input"
                placeholder="e.g. your.email@gmail.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Backend Connection URL</label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                className="text-input"
                placeholder="e.g. http://localhost:5000"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Stats Grid */}
      <section className="stats-grid">
        <div className="glass-panel stat-card">
          <span className="stat-label">Processed</span>
          <span className="stat-value">{stats?.total_processed ?? 0}</span>
          <span className="stat-sub">Total Emails Ingested</span>
        </div>
        <div className="glass-panel stat-card">
          <span className="stat-label">Tasks Routed</span>
          <span className="stat-value">
            {stats?.statuses?.find((s: any) => s.status === 'created_task')?.count ?? 0}
          </span>
          <span className="stat-sub">Active Task Store</span>
        </div>
        <div className="glass-panel stat-card skipped">
          <span className="stat-label">Ignored Noise</span>
          <span className="stat-value">
            {stats?.statuses?.find((s: any) => s.status === 'skipped')?.count ?? 0}
          </span>
          <span className="stat-sub">OOO, newsletters, vendor spam</span>
        </div>
        <div className="glass-panel stat-card spurious">
          <span className="stat-label">Spurious Rate</span>
          <span className="stat-value">
            {stats?.spurious_rate ? `${(stats.spurious_rate * 100).toFixed(1)}%` : '0.0%'}
          </span>
          <span className="stat-sub">{stats?.spurious_count ?? 0} routed noise items</span>
        </div>
      </section>

      {/* 3. Input & Ingest Section */}
      <section className="glass-panel">
        <h2 className="section-title">
          <Inbox className="w-5 h-5 text-accent-purple" />
          Raw JSON Email Batch Input
        </h2>
        <div className="form-group">
          <label className="form-label">Paste a JSON batch of emails below (Max 100 per batch)</label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="textarea-input json-area"
            placeholder='[
  {
    "email_id": "em_00142",
    "thread_id": "th_0091",
    "from_name": "Suresh Kulkarni",
    "from_email": "s.kulkarni@meridiansteel.co.in",
    "subject": "RFP - Enterprise Document Management System",
    "body": "Dear Team, Please find attached...",
    "received_at": "2026-08-01T09:14:22+05:30",
    "is_reply": false
  }
]'
          />
        </div>

        {parseError && (
          <div className="badge" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.2)', width: '100%', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        <div className="button-row">
          <button
            onClick={handleIngest}
            disabled={rawEmails.length === 0 || isIngesting}
            className="btn btn-primary"
          >
            {isIngesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Routing and Writing Tasks...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Ingest & Route Batch ({rawEmails.length} emails)
              </>
            )}
          </button>
          <button onClick={handleGenerateSample} className="btn btn-secondary">
            Generate 250 Sample Emails
          </button>
          <button onClick={fetchStatsAndTasks} className="btn btn-secondary" title="Refresh data">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Ingestion results summary banner */}
        {ingestSummary && (
          <div className="badge" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)', width: '100%', borderRadius: '8px', padding: '1rem', marginTop: '1.25rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>Batch Run Complete:</span>
            <span>Processed: <strong>{ingestSummary.processed}</strong></span>
            <span>Created Tasks: <strong>{ingestSummary.tasks_created}</strong></span>
            <span>Updated Tasks: <strong>{ingestSummary.tasks_updated}</strong></span>
            <span>Skipped (Noise): <strong>{ingestSummary.skipped}</strong></span>
            {ingestSummary.errors.length > 0 && (
              <span style={{ color: 'var(--accent-rose)' }}>Errors: <strong>{ingestSummary.errors.length}</strong></span>
            )}
          </div>
        )}

        {/* Raw Ingest Preview Table */}
        {rawEmails.length > 0 && (
          <div className="table-container">
            <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
              <strong>Visual Preview:</strong> Raw email structure parsed from JSON (independent of routing logic)
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Received At</th>
                  <th>Thread ID</th>
                  <th>Body Preview</th>
                </tr>
              </thead>
              <tbody>
                {rawEmails.slice(0, 10).map((email, idx) => (
                  <tr key={email.email_id || idx}>
                    <td>
                      <div style={{ fontWeight: 500, color: '#fff' }}>{email.from_name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{email.from_email}</div>
                    </td>
                    <td>{email.subject}</td>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {email.received_at?.split('T')[0] ?? '—'}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>{email.thread_id}</td>
                    <td className="truncate-text" style={{ color: 'var(--text-secondary)' }}>{email.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rawEmails.length > 10 && (
              <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing 10 of {rawEmails.length} parsed emails. Submit to route the full batch.
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Split Dashboard Grid */}
      <section className="main-dashboard">
        {/* Left Side: Tasks & Queue list */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-title" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
              <Inbox className="w-5 h-5 text-accent-cyan" />
              Routed Task Queue
            </h2>
            <div className="btn-secondary" style={{ display: 'flex', borderRadius: '8px', padding: '2px', border: '1px solid var(--glass-border)' }}>
              <button
                onClick={() => setActiveTab('tasks')}
                className="btn"
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  background: activeTab === 'tasks' ? 'var(--primary-gradient)' : 'transparent',
                  color: activeTab === 'tasks' ? '#fff' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                Tasks ({tasks.length})
              </button>
            </div>
          </div>

          <div className="table-container" style={{ margin: 0 }}>
            {tasks.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                No tasks available. Paste a batch above to begin routing.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task & Company</th>
                    <th>Assignee</th>
                    <th>Category</th>
                    <th>Value / Due</th>
                    <th>Conf</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.task_id}
                      onClick={() => setSelectedTask(task)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }} className="truncate-text">
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {task.company_name || 'Individual'} • {task.from_name || 'No Sender'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>{getAssigneeName(task.assignee_id)}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${task.category}`}>
                          {getCategoryLabel(task.category)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#fff', fontSize: '0.85rem' }}>
                          {formatCurrency(task.deal_value_inr)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {task.due_date ? `Due: ${task.due_date}` : 'No deadline'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: task.confidence > 0.8 ? 'var(--accent-emerald)' : task.confidence > 0.5 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                            }}
                          >
                            {Math.round(task.confidence * 100)}%
                          </span>
                          <span className={`priority-pill ${task.priority}`}>
                            {task.priority[0]}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Conversational grounding Chatbot */}
        <div className="glass-panel chat-container" style={{ position: 'relative' }}>
          <h2 className="section-title">
            <MessageSquare className="w-5 h-5 text-accent-purple" />
            Query Engine & Grounded Chat
          </h2>

          <div className="chat-history">
            {chatHistory.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Terminal className="w-10 h-10 mx-auto mb-3 opacity-30 text-accent-purple" />
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Ask the Task Router questions about the email batch:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <div>• "How many emails this batch were proposal or RFP-related?"</div>
                  <div>• "How many were marketing versus actual spam we correctly ignored?"</div>
                  <div>• "Show me everything sitting in triage and why."</div>
                  <div>• "What's our spurious rate so far?"</div>
                  <div>• "What's the total deal value of all open RFPs?"</div>
                </div>
              </div>
            )}

            {chatHistory.map((message, index) => (
              <div key={index} className={`chat-bubble ${message.sender}`}>
                <div>{message.text}</div>
                
                {/* Supporting SQL Data Accordion (Section 7.3 requirement) */}
                {message.supportingData && Object.keys(message.supportingData).length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={() => toggleSupportingData(index)}
                      className="supporting-data-toggle"
                    >
                      {message.showData ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {message.showData ? 'Hide' : 'Show'} supporting database query data
                    </button>
                    {message.showData && (
                      <pre className="supporting-data-preview">
                        {JSON.stringify(message.supportingData, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isChatLoading && (
              <div className="chat-bubble assistant" style={{ width: '60px', padding: '0.75rem' }}>
                <span className="loading-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendChat} className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="text-input"
              placeholder="Ask about routing rules, statistics, spurious rate..."
              disabled={isChatLoading}
            />
            <button type="submit" className="btn btn-primary" disabled={isChatLoading || !chatInput.trim()}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* 5. Detailed Task Inspection Panel (Modal replacement for previewing tasks) */}
      {selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyItems: 'center', padding: '1.5rem' }}>
          <div className="glass-panel glowing" style={{ maxWidth: '640px', width: '100%', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>Task Details: {selectedTask.task_id}</h3>
              <button onClick={() => setSelectedTask(null)} className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>Close</button>
            </div>
            
            <div className="task-details-modal">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Title</span>
                  <span className="detail-value">{selectedTask.title}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assignee</span>
                  <span className="detail-value">{getAssigneeName(selectedTask.assignee_id)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">
                    <span className={`status-pill ${selectedTask.category}`}>{getCategoryLabel(selectedTask.category)}</span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority</span>
                  <span className="detail-value">
                    <span className={`priority-pill ${selectedTask.priority}`}>{selectedTask.priority}</span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Deal Value</span>
                  <span className="detail-value">{formatCurrency(selectedTask.deal_value_inr)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Due Date</span>
                  <span className="detail-value">{selectedTask.due_date || 'None'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Company Name</span>
                  <span className="detail-value">{selectedTask.company_name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Confidence Score</span>
                  <span className="detail-value">{Math.round(selectedTask.confidence * 100)}%</span>
                </div>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">Task Description</span>
                  <span className="detail-value" style={{ background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', border: '1px solid var(--glass-border)', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    {selectedTask.description || 'No description provided'}
                  </span>
                </div>
                {selectedTask.decision_reasoning && (
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">Gemini Router Reasoning</span>
                    <span className="detail-value reasoning">
                      {selectedTask.decision_reasoning}
                    </span>
                  </div>
                )}
                {selectedTask.from_email && (
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">Original Sender</span>
                    <span className="detail-value" style={{ fontSize: '0.85rem' }}>
                      {selectedTask.from_name ? `${selectedTask.from_name} <${selectedTask.from_email}>` : selectedTask.from_email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
