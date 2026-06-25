import { useState } from 'react';
import { Sparkles, Users, Mail, AlertTriangle, ArrowRight, Plus, Terminal } from 'lucide-react';
import { analyzeCompany } from '../utils/gemini';

export default function Dashboard({ leads, setLeads, apiKey, onNavigateToOutreach }) {
  const [quickDomain, setQuickDomain] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Statistics
  const totalLeads = leads.length;
  const completedLeads = leads.filter(l => l.status === 'completed').length;
  const pendingLeads = leads.filter(l => l.status === 'pending').length;
  const errorLeads = leads.filter(l => l.status === 'error').length;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickDomain) return;
    
    setErrorMsg('');

    // If API key is missing, warn the user
    if (!apiKey) {
      setErrorMsg("Please add your Gemini API Key in Settings first to run real-time AI research.");
      return;
    }

    setIsProcessing(true);

    // Create a temporary pending lead object
    const newLeadId = 'lead-' + Date.now();
    const tempLead = {
      id: newLeadId,
      companyName: quickDomain.replace(/\.[^/.]+$/, ""), // naive company name from domain
      domain: quickDomain,
      status: 'processing',
      industry: 'Analyzing...',
      valueProposition: 'AI is researching this domain...',
      targetAudience: '',
      painPoints: [],
      hooks: []
    };

    setLeads(prev => [tempLead, ...prev]);
    setQuickDomain('');

    try {
      // Call real Gemini Company Analyzer
      const result = await analyzeCompany(quickDomain, apiKey);
      
      setLeads(prev => prev.map(item => {
        if (item.id === newLeadId) {
          return {
            ...item,
            ...result,
            status: 'completed'
          };
        }
        return item;
      }));
    } catch (err) {
      console.error(err);
      setLeads(prev => prev.map(item => {
        if (item.id === newLeadId) {
          return {
            ...item,
            status: 'error',
            valueProposition: `AI Research failed: ${err.message}`
          };
        }
        return item;
      }));
      setErrorMsg(err.message || "Failed to analyze domain.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fade-in">
      <header className="view-header">
        <div className="view-title-area">
          <h1 className="view-title">Overview</h1>
          <p className="view-subtitle">Your AI-powered sales research and outreach pipeline</p>
        </div>
      </header>

      {/* Stats Counter Section */}
      <section className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-data">
            <span className="stat-value">{totalLeads}</span>
            <span className="stat-label">Total Leads</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon">
            <Sparkles />
          </div>
          <div className="stat-data">
            <span className="stat-value">{completedLeads}</span>
            <span className="stat-label">AI Researched</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon">
            <Mail />
          </div>
          <div className="stat-data">
            <span className="stat-value">{leads.filter(l => l.emailBody).length}</span>
            <span className="stat-label">Outreach Drafts</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Quick Add & Recent Leads */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Quick Add Research Box */}
        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
            Instant Lead Research
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Enter a domain name (e.g. <code>github.com</code>) to trigger an automated B2B sales analysis report.
          </p>

          <form onSubmit={handleQuickAdd} className="quick-add-container">
            <input 
              type="text" 
              placeholder="e.g. stripe.com" 
              value={quickDomain}
              onChange={(e) => setQuickDomain(e.target.value)}
              disabled={isProcessing}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={isProcessing}>
              {isProcessing ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <Plus size={18} />
                  Analyze
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="api-notice-box" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#ff8a8a' }}>
              <AlertTriangle style={{ width: '18px', height: '18px' }} />
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Research Alert:</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {!apiKey && (
            <div className="api-notice-box">
              <Terminal style={{ width: '18px', height: '18px' }} />
              <div>
                <p style={{ fontWeight: 600 }}>Demo Mode active</p>
                <p>Add your API Key in Settings to run live Google Gemini analysis queries.</p>
              </div>
            </div>
          )}
        </section>

        {/* Recent Lead Activity */}
        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Recent Lead Activity</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
            {leads.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <Users size={32} />
                <p className="empty-state-title">No leads yet</p>
                <p className="empty-state-desc">Input a domain on the left to begin your outreach pipeline.</p>
              </div>
            ) : (
              leads.slice(0, 4).map(lead => (
                <div 
                  key={lead.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <div className="company-logo-placeholder">
                      {lead.companyName ? lead.companyName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{lead.companyName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{lead.domain}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge badge-${lead.status}`}>
                      {lead.status === 'processing' ? 'analyzing' : lead.status}
                    </span>
                    {lead.status === 'completed' && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigateToOutreach(lead.id)}
                        style={{ padding: '0.25rem 0.5rem', display: 'flex', gap: '0.25rem' }}
                      >
                        Write <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
