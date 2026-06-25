import { useState } from 'react';
import { Eye, EyeOff, Save, Key, User, Info, CheckCircle } from 'lucide-react';

export default function Settings({ apiKey, setApiKey, userProfile, setUserProfile }) {
  const [showKey, setShowKey] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...userProfile });
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setUserProfile(profileForm);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
    }, 3000);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fade-in">
      <header className="view-header">
        <div className="view-title-area">
          <h1 className="view-title">Settings</h1>
          <p className="view-subtitle">Configure your workspace, sender profile, and AI keys</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* API Key Panel */}
        <section className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
            <Key style={{ color: 'var(--primary)', width: '20px', height: '20px' }} />
            Gemini API Key
          </h3>
          
          <div className="api-notice-box">
            <Info style={{ width: '18px', height: '18px' }} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>How it works:</p>
              <p>Your API key is stored safely directly in your local browser's <code>localStorage</code>. It is never sent to any server except directly to Google's Gemini API endpoints.</p>
              <p style={{ marginTop: '0.5rem' }}>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 500 }}>
                  Get a free Gemini API Key from Google AI Studio &rarr;
                </a>
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="apiKey">Gemini API Key</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="apiKey"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                style={{ paddingRight: '2.5rem' }}
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
                  value={profileForm.senderName}
                  onChange={handleProfileChange}
                  placeholder="e.g. John Vercher"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="senderTitle">Your Job Title</label>
                <input
                  id="senderTitle"
                  name="senderTitle"
                  type="text"
                  value={profileForm.senderTitle}
                  onChange={handleProfileChange}
                  placeholder="e.g. Head of Business Development"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="senderCompany">Your Company Name</label>
              <input
                id="senderCompany"
                name="senderCompany"
                type="text"
                value={profileForm.senderCompany}
                onChange={handleProfileChange}
                placeholder="e.g. OutreachFlow Systems"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="senderProductDesc">Product / Service Pitch</label>
              <textarea
                id="senderProductDesc"
                name="senderProductDesc"
                value={profileForm.senderProductDesc}
                onChange={handleProfileChange}
                placeholder="Explain what your product does, who it helps, and the key benefit (e.g. 'A workflow automation builder that helps HR teams save 12 hours a week on candidate screening by auto-grading resumes')"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <div>
                {savedFeedback && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 500 }}>
                    <CheckCircle size={18} />
                    Profile saved successfully!
                  </span>
                )}
              </div>
              
              <button type="submit" className="btn btn-primary">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}
