import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Key, User, Info, CheckCircle, AlertTriangle, CreditCard, Sparkles } from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function Settings({ apiKey, setApiKey, userProfile, setUserProfile, onSaveProfile, isPremium, setIsPremium, session }) {
  const [showKey, setShowKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [profileForm, setProfileForm] = useState({ ...userProfile });
  const [loading, setLoading] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setProfileForm({ ...userProfile });
  }, [userProfile]);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedFeedback(false);
    setErrorMsg('');

    try {
      await onSaveProfile(profileForm, localApiKey);
      setSavedFeedback(true);
      setTimeout(() => {
        setSavedFeedback(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Developer toggle helper to simulate subscription activations in Supabase
  const toggleDevPremium = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const nextState = !isPremium;
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: nextState })
        .eq('id', session.user.id);
      
      if (error) throw error;
      setIsPremium(nextState);
    } catch (err) {
      console.error('Toggle Dev Premium Error:', err);
      alert('Failed to toggle dev subscription status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <header className="view-header">
        <div className="view-title-area">
          <h1 className="view-title">Settings</h1>
          <p className="view-subtitle">Configure your workspace, sender profile, and AI keys</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        
        {/* Subscription Plan Panel */}
        <section className="glass-card" style={{ borderLeft: isPremium ? '4px solid var(--success)' : '4px solid var(--primary)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
            <CreditCard style={{ color: isPremium ? 'var(--success)' : 'var(--primary)', width: '20px', height: '20px' }} />
            Subscription Plan
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {isPremium ? "OutreachFlow Pro" : "OutreachFlow Free (Trial)"}
                </span>
                <span className={`badge ${isPremium ? 'badge-completed' : 'badge-pending'}`}>
                  {isPremium ? 'Active' : 'Limited'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '500px' }}>
                {isPremium 
                  ? "You have unlocked unlimited B2B company research and personalized copywriting. Thank you for subscribing!" 
                  : "You are currently limited to a maximum of 3 B2B company profiles. Upgrade to Pro for unlimited research & drafts."
                }
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {!isPremium && (
                <a 
                  href="https://buy.stripe.com/test_eVq3cu0G6bz64lAcir4gg00" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <Sparkles size={16} />
                  Upgrade to Pro ($19/mo)
                </a>
              )}
              
              {/* Developer Toggle Option */}
              <button 
                type="button" 
                onClick={toggleDevPremium}
                className="btn btn-secondary"
                disabled={loading}
                style={{ fontSize: '0.8rem', padding: '0.6rem 0.8rem' }}
                title="Toggle billing flag in database for developer testing"
              >
                {isPremium ? "Dev: Reset to Free" : "Dev: Simulate Stripe Success"}
              </button>
            </div>
          </div>
        </section>

        {/* API Key Panel */}
        <section className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
            <Key style={{ color: 'var(--primary)', width: '20px', height: '20px' }} />
            Gemini API Key
          </h3>
          
          <div className="api-notice-box">
            <Info style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>How it works:</p>
              <p>Your API key is saved to your profile in the database. It is only accessible to you and is used directly to make request queries to Google Gemini.</p>
              <p style={{ marginTop: '0.5rem' }}>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 500 }}>
                  Get a free Gemini API Key from Google AI Studio &rarr;
                </a>
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="localApiKey">Gemini API Key</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="localApiKey"
                type={showKey ? "text" : "password"}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="AIzaSy..."
                style={{ paddingRight: '2.5rem' }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </section>

        {/* Sender Profile Panel */}
        <section className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
            <User style={{ color: 'var(--primary)', width: '20px', height: '20px' }} />
            Sender Profile
          </h3>

          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="senderName">Your Name</label>
                <input
                  id="senderName"
                  name="senderName"
                  type="text"
                  value={profileForm.senderName || ''}
                  onChange={handleProfileChange}
                  placeholder="e.g. John Vercher"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="senderTitle">Your Job Title</label>
                <input
                  id="senderTitle"
                  name="senderTitle"
                  type="text"
                  value={profileForm.senderTitle || ''}
                  onChange={handleProfileChange}
                  placeholder="e.g. Head of Business Development"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="senderCompany">Your Company Name</label>
              <input
                id="senderCompany"
                name="senderCompany"
                type="text"
                value={profileForm.senderCompany || ''}
                onChange={handleProfileChange}
                placeholder="e.g. OutreachFlow Systems"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="senderProductDesc">Product / Service Pitch</label>
              <textarea
                id="senderProductDesc"
                name="senderProductDesc"
                value={profileForm.senderProductDesc || ''}
                onChange={handleProfileChange}
                placeholder="Explain what your product does, who it helps, and the key benefit (e.g. 'A workflow automation builder that helps HR teams save 12 hours a week on candidate screening by auto-grading resumes')"
                required
                disabled={loading}
              />
            </div>

            {errorMsg && (
              <div className="api-notice-box" style={{ background: 'rgba(255, 59, 48, 0.05)', borderColor: 'rgba(255, 59, 48, 0.15)', color: 'var(--danger)' }}>
                <AlertTriangle style={{ width: '18px', height: '18px' }} />
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Save Error:</p>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <div>
                {savedFeedback && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 500 }}>
                    <CheckCircle size={18} />
                    Workspace saved and synced!
                  </span>
                )}
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <Save size={18} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}
