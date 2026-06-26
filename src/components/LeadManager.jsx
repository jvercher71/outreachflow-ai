import { useState } from 'react';
import { Plus, Trash2, Mail, Download, Sparkles, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { analyzeCompany } from '../utils/gemini';

export default function LeadManager({ leads, setLeads, apiKey, onNavigateToOutreach, session }) {
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [activeResearchId, setActiveResearchId] = useState(null);

  // Bulk add domains
  const handleBulkAdd = async (e) => {
    e.preventDefault();
    if (!bulkInput.trim() || !session?.user) return;

    // naive split by comma, space, or newlines
    const domains = bulkInput
      .split(/[\n,\s]+/)
      .map(d => d.trim().toLowerCase())
      .filter(d => d.length > 0 && d.includes('.')); // naive domain check

    try {
      const rowsToInsert = domains.map(domain => {
        const companyName = domain.replace(/\.[^/.]+$/, "");
        return {
          company_name: companyName.charAt(0).toUpperCase() + companyName.slice(1),
          domain: domain,
          status: 'pending',
          user_id: session.user.id,
          value_proposition: 'Pending AI research. Click "Research" to start.',
          pain_points: [],
          hooks: []
        };
      });

      const { data, error } = await supabase
        .from('leads')
        .insert(rowsToInsert)
        .select();

      if (error) throw error;

      if (data) {
        // Map database objects to react state
        const newLeadsMapped = data.map(l => ({
          id: l.id,
          companyName: l.company_name,
          domain: l.domain,
          status: l.status,
          industry: l.industry || 'Not Analyzed',
          valueProposition: l.value_proposition || '',
          targetAudience: l.target_audience || '',
          painPoints: l.pain_points || [],
          hooks: l.hooks || [],
          emailSubject: l.email_subject || '',
          emailBody: l.email_body || ''
        }));

        setLeads(prev => [...newLeadsMapped, ...prev]);
        setBulkInput('');
        setShowBulkAdd(false);
      }
    } catch (err) {
      console.error('Bulk Import Error:', err);
      alert('Failed to import leads: ' + err.message);
    }
  };

  // Run research on a single lead
  const runResearch = async (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    if (!apiKey) {
      alert("Please add your Gemini API Key in Settings to run AI research.");
      return;
    }

    setActiveResearchId(leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'processing', valueProposition: 'AI is researching this domain...' } : l));

    try {
      // 1. Perform AI analysis
      const result = await analyzeCompany(lead.domain, apiKey);
      
      // 2. Update Supabase leads table
      const { error } = await supabase
        .from('leads')
        .update({
          company_name: result.companyName,
          industry: result.industry,
          value_proposition: result.valueProposition,
          target_audience: result.targetAudience,
          pain_points: result.painPoints,
          hooks: result.hooks,
          status: 'completed'
        })
        .eq('id', leadId);

      if (error) throw error;

      // 3. Update local state
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...result, status: 'completed' } : l));
    } catch (err) {
      console.error('Research error:', err);
      
      // Mark as error in DB
      await supabase
        .from('leads')
        .update({ status: 'error', value_proposition: `Research Failed: ${err.message}` })
        .eq('id', leadId);

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'error', valueProposition: `Research Failed: ${err.message}` } : l));
    } finally {
      setActiveResearchId(null);
    }
  };

  // Run research on all pending leads sequentially
  const runResearchOnAllPending = async () => {
    const pending = leads.filter(l => l.status === 'pending' || l.status === 'error');
    if (pending.length === 0) return;

    if (!apiKey) {
      alert("Please add your Gemini API Key in Settings to run AI research.");
      return;
    }

    setIsProcessingAll(true);

    for (let lead of pending) {
      setActiveResearchId(lead.id);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'processing', valueProposition: 'AI is researching this domain...' } : l));
      
      try {
        const result = await analyzeCompany(lead.domain, apiKey);
        
        await supabase
          .from('leads')
          .update({
            company_name: result.companyName,
            industry: result.industry,
            value_proposition: result.valueProposition,
            target_audience: result.targetAudience,
            pain_points: result.painPoints,
            hooks: result.hooks,
            status: 'completed'
          })
          .eq('id', lead.id);

        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...result, status: 'completed' } : l));
      } catch (err) {
        console.error('Bulk Research error for domain ' + lead.domain, err);
        
        await supabase
          .from('leads')
          .update({ status: 'error', value_proposition: `Research Failed: ${err.message}` })
          .eq('id', lead.id);

        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'error', valueProposition: `Research Failed: ${err.message}` } : l));
      }
    }

    setIsProcessingAll(false);
    setActiveResearchId(null);
  };

  // Delete lead
  const handleDeleteLead = async (leadId) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (err) {
      console.error('Delete lead error:', err);
      alert('Failed to delete lead: ' + err.message);
    }
  };

  // Export leads to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = ["Company Name", "Domain", "Industry", "Value Proposition", "Target Audience", "Pain Points", "Subject", "Email Body"];
    const rows = leads.map(l => [
      l.companyName || "",
      l.domain || "",
      l.industry || "",
      l.valueProposition || "",
      l.targetAudience || "",
      (l.painPoints || []).join("; "),
      l.emailSubject || "",
      l.emailBody || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","), 
         ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(","))]
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `outreachflow_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fade-in">
      <header className="view-header">
        <div className="view-title-area">
          <h1 className="view-title">Lead Manager</h1>
          <p className="view-subtitle">Import, research, and organize your target accounts</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {leads.length > 0 && (
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <Download size={18} />
              Export CSV
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowBulkAdd(!showBulkAdd)}>
            <Plus size={18} />
            Bulk Add Domains
          </button>
        </div>
      </header>

      {/* Bulk Add Form Drawer */}
      {showBulkAdd && (
        <section className="glass-card fade-in" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Bulk Import Domains</h3>
          <form onSubmit={handleBulkAdd}>
            <div className="form-group">
              <label htmlFor="bulkInput">Enter domain names (one per line, or separated by commas)</label>
              <textarea
                id="bulkInput"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="e.g.&#10;openai.com&#10;notion.so&#10;figma.com"
                required
                style={{ minHeight: '120px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowBulkAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Import Leads</button>
            </div>
          </form>
        </section>
      )}

      {/* Table & Actions */}
      <section className="glass-card">
        
        {/* Table Operations */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-main)', fontSize: '1.1rem' }}>
            All Leads ({leads.length})
          </h4>

          {leads.some(l => l.status === 'pending' || l.status === 'error') && (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={runResearchOnAllPending} 
              disabled={isProcessingAll}
              style={{ padding: '0.5rem 1rem' }}
            >
              {isProcessingAll ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Research All Pending
                </>
              )}
            </button>
          )}
        </div>

        {leads.length === 0 ? (
          <div className="empty-state">
            <FileSpreadsheet size={48} />
            <p className="empty-state-title">No leads in your database</p>
            <p className="empty-state-desc">Import companies or domains to begin researching them with AI.</p>
          </div>
        ) : (
          <div className="table-wrapper scroll-custom">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Value Proposition</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <div className="company-cell">
                        <div className="company-logo-placeholder">
                          {lead.companyName ? lead.companyName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lead.companyName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.domain}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <span style={{ fontSize: '0.85rem', color: lead.status === 'completed' ? 'var(--text-main)' : 'var(--text-dim)' }}>
                        {lead.industry}
                      </span>
                    </td>
                    
                    <td style={{ maxWidth: '320px' }}>
                      <div 
                        style={{ 
                          fontSize: '0.85rem', 
                          color: lead.status === 'completed' ? 'var(--text-muted)' : 'var(--text-dim)',
                          whiteSpace: 'nowrap', 
                          textOverflow: 'ellipsis', 
                          overflow: 'hidden' 
                        }}
                        title={lead.valueProposition}
                      >
                        {lead.valueProposition}
                      </div>
                    </td>
                    
                    <td>
                      <span className={`badge badge-${lead.status}`}>
                        {lead.status === 'processing' ? 'researching' : lead.status}
                      </span>
                    </td>
                    
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {lead.status !== 'completed' && lead.status !== 'processing' && (
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => runResearch(lead.id)}
                            disabled={activeResearchId !== null}
                            title="Run AI company research"
                          >
                            <Sparkles size={14} /> Research
                          </button>
                        )}
                        
                        {lead.status === 'processing' && (
                          <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.8 }}>
                            <span className="spinner" style={{ width: '12px', height: '12px' }}></span>
                          </button>
                        )}

                        {lead.status === 'completed' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => onNavigateToOutreach(lead.id)}
                            title="Generate outreach email"
                          >
                            <Mail size={14} /> Write
                          </button>
                        )}

                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteLead(lead.id)}
                          title="Delete Lead"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
