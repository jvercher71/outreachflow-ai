import { useState, useEffect } from 'react';
import { Mail, Copy, Send, Sparkles, AlertCircle, Save, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { generateOutreachEmail } from '../utils/gemini';

export default function OutreachStudio({ leads, setLeads, selectedLeadId, setSelectedLeadId, userProfile, apiKey, session }) {
  const completedLeads = leads.filter(l => l.status === 'completed');
  const [activeLead, setActiveLead] = useState(null);

  useEffect(() => {
    if (selectedLeadId) {
      const found = completedLeads.find(l => l.id === selectedLeadId);
      if (found) {
        setActiveLead(found);
        return;
      }
    }
    if (completedLeads.length > 0) {
      setActiveLead(completedLeads[0]);
      setSelectedLeadId(completedLeads[0].id);
    } else {
      setActiveLead(null);
    }
  }, [selectedLeadId, leads]);

  // Form State
  const [config, setConfig] = useState({
    tone: 'value-first',
    goal: 'book-meeting',
    length: 'short',
    customInstructions: ''
  });

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync editor fields when activeLead changes
  useEffect(() => {
    if (activeLead) {
      setSubject(activeLead.emailSubject || '');
      setBody(activeLead.emailBody || '');
      setErrorMsg('');
    }
  }, [activeLead]);

  const handleSelectLead = (e) => {
    const id = e.target.value;
    setSelectedLeadId(id);
  };

  // Generate Email handler
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!activeLead) return;
    setErrorMsg('');

    if (!apiKey) {
      setErrorMsg("Please add your Gemini API Key in Settings first to run real-time AI email generation.");
      return;
    }

    if (!userProfile.senderName || !userProfile.senderCompany) {
      setErrorMsg("Please complete your Sender Profile (Name & Company) in Settings so the AI knows who you are.");
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Generate via Gemini
      const emailResult = await generateOutreachEmail({
        lead: activeLead,
        userProfile,
        config,
        apiKey
      });

      setSubject(emailResult.subject);
      setBody(emailResult.body);
      
      // 2. Save to Postgres
      const { error } = await supabase
        .from('leads')
        .update({
          email_subject: emailResult.subject,
          email_body: emailResult.body
        })
        .eq('id', activeLead.id);

      if (error) throw error;

      // 3. Update local state
      updateLeadEmail(activeLead.id, emailResult.subject, emailResult.body);
      setSaveStatus('Draft generated and saved.');
      setTimeout(() => setSaveStatus(''), 4000);
    } catch (err) {
      console.error('Email Generation Error:', err);
      setErrorMsg(err.message || "Failed to generate outreach email.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual save handler
  const handleSaveDraft = async () => {
    if (!activeLead) return;
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          email_subject: subject,
          email_body: body
        })
        .eq('id', activeLead.id);

      if (error) throw error;

      updateLeadEmail(activeLead.id, subject, body);
      setSaveStatus('Draft saved successfully.');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Save draft error:', err);
      alert('Failed to save draft to database: ' + err.message);
    }
  };

  // Local state helper
  const updateLeadEmail = (leadId, sub, text) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          emailSubject: sub,
          emailBody: text
        };
      }
      return l;
    }));
  };

  // Copy helper
  const handleCopyClipboard = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setSaveStatus('Copied to clipboard!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // Mailto helper
  const handleMailto = () => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    window.open(`mailto:?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
  };

  return (
    <div className="fade-in">
      <header className="view-header">
        <div className="view-title-area">
          <h1 className="view-title">Outreach Studio</h1>
          <p className="view-subtitle">Craft highly personalized email campaigns using company intelligence</p>
        </div>
      </header>

      {completedLeads.length === 0 ? (
        <section className="glass-card">
          <div className="empty-state">
            <Mail size={48} />
            <p className="empty-state-title">No researched leads found</p>
            <p className="empty-state-desc" style={{ marginBottom: '1.5rem' }}>
              You need at least one researched lead to draft emails. Go to the Lead Manager, input a domain, and click "Research".
            </p>
          </div>
        </section>
      ) : (
        <div>
          {/* Top Selection Strip */}
          <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Account:</span>
            <select 
              value={activeLead?.id || ''} 
              onChange={handleSelectLead}
              style={{ padding: '0.5rem 1rem', maxWidth: '350px' }}
            >
              {completedLeads.map(l => (
                <option key={l.id} value={l.id}>{l.companyName} ({l.domain})</option>
              ))}
            </select>
          </div>

          <div className="studio-layout">
            {/* Left Controls & Intelligence */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {activeLead && (
                <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    AI Intelligence Report
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>Value Proposition</span>
                      <span style={{ color: 'var(--text-muted)' }}>{activeLead.valueProposition}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>Key Pain Points</span>
                      <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {activeLead.painPoints?.map((p, idx) => (
                          <li key={idx} style={{ marginBottom: '0.2rem' }}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Form */}
              <div className="glass-card">
                <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.25rem', fontSize: '1.05rem' }}>
                  Email Settings
                </h4>
                
                <form onSubmit={handleGenerate}>
                  <div className="form-group">
                    <label htmlFor="tone">Tone of Voice</label>
                    <select 
                      id="tone" 
                      value={config.tone}
                      onChange={(e) => setConfig(prev => ({ ...prev, tone: e.target.value }))}
                    >
                      <option value="value-first">Value-First (ROI & benefits)</option>
                      <option value="casual">Casual (Friendly, conversational)</option>
                      <option value="professional">Professional (Corporate tone)</option>
                      <option value="curious">Curious (Asking a soft question)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="goal">Outreach Goal</label>
                    <select 
                      id="goal"
                      value={config.goal}
                      onChange={(e) => setConfig(prev => ({ ...prev, goal: e.target.value }))}
                    >
                      <option value="book-meeting">Book a brief chat/demo</option>
                      <option value="explore-partnership">Explore mutual partnership</option>
                      <option value="ask-feedback">Get product/design feedback</option>
                      <option value="share-resource">Share a free resource/audit</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="length">Length</label>
                    <select 
                      id="length"
                      value={config.length}
                      onChange={(e) => setConfig(prev => ({ ...prev, length: e.target.value }))}
                    >
                      <option value="short">Short (~100 words)</option>
                      <option value="medium">Medium (~180 words)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="customInstructions">Custom Details / Context</label>
                    <textarea 
                      id="customInstructions"
                      value={config.customInstructions}
                      onChange={(e) => setConfig(prev => ({ ...prev, customInstructions: e.target.value }))}
                      placeholder="e.g. 'Mention we are both based in New York' or 'Reference their recent funding round'"
                      style={{ minHeight: '80px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Write Email with AI
                      </>
                    )}
                  </button>
                </form>

                {errorMsg && (
                  <div className="api-notice-box" style={{ background: 'rgba(255, 59, 48, 0.05)', borderColor: 'rgba(255, 59, 48, 0.15)', color: 'var(--danger)', marginTop: '1rem', marginBottom: 0 }}>
                    <AlertCircle style={{ width: '18px', height: '18px' }} />
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Generation Issue:</p>
                      <p style={{ fontSize: '0.8rem' }}>{errorMsg}</p>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Right Editor & Preview */}
            <section className="glass-card email-editor-panel" style={{ minHeight: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Email Workspace</h4>
                <div>
                  {saveStatus && (
                    <span style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                      <CheckCircle size={14} />
                      {saveStatus}
                    </span>
                  )}
                </div>
              </div>

              {body ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1, marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label htmlFor="subjectLine">Subject Line</label>
                    <input 
                      id="subjectLine"
                      type="text" 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject..."
                      style={{ fontWeight: 600 }}
                    />
                  </div>

                  <div className="form-group" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="emailBody">Email Body</label>
                    <textarea 
                      id="emailBody"
                      value={body} 
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Write your email here..."
                      style={{ flexGrow: 1, minHeight: '260px', fontFamily: 'var(--font-body)', lineHeight: '1.6' }}
                    />
                  </div>

                  <div className="email-actions">
                    <button className="btn btn-secondary" onClick={handleSaveDraft} title="Save changes to local database">
                      <Save size={18} />
                      Save Draft
                    </button>
                    <button className="btn btn-secondary" onClick={handleCopyClipboard} title="Copy email subject & body">
                      <Copy size={18} />
                      Copy to Clipboard
                    </button>
                    <button className="btn btn-primary" onClick={handleMailto} title="Open in default email app (Outlook, Mail, etc.)">
                      <Send size={18} />
                      Send Outreach
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ flexGrow: 1 }}>
                  <Mail size={40} />
                  <p className="empty-state-title">No email generated yet</p>
                  <p className="empty-state-desc">Configure your outreach parameters on the left and click "Write Email" to generate a personalized draft.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
