import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Mail, Settings as SettingsIcon, LogOut, Loader } from 'lucide-react';
import { supabase } from './utils/supabase';
import Dashboard from './components/Dashboard';
import LeadManager from './components/LeadManager';
import OutreachStudio from './components/OutreachStudio';
import SettingsComponent from './components/Settings';
import Auth from './components/Auth';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [leads, setLeads] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  
  const [userProfile, setUserProfile] = useState({
    senderName: '',
    senderTitle: '',
    senderCompany: '',
    senderProductDesc: ''
  });

  // Listen to Auth State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when authenticated user session changes
  useEffect(() => {
    if (session?.user) {
      fetchProfile(session.user.id);
      fetchLeads();
    } else {
      setLeads([]);
      setUserProfile({
        senderName: '',
        senderTitle: '',
        senderCompany: '',
        senderProductDesc: ''
      });
      setApiKey('');
      setIsPremium(false);
    }
  }, [session]);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is single row empty
      
      if (data) {
        setUserProfile({
          senderName: data.sender_name || '',
          senderTitle: data.sender_title || '',
          senderCompany: data.sender_company || '',
          senderProductDesc: data.sender_product_desc || ''
        });
        setApiKey(data.gemini_api_key || '');
        setIsPremium(data.is_premium || false);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Map postgres naming to react state naming
        const mapped = data.map(l => ({
          id: l.id,
          companyName: l.company_name,
          domain: l.domain,
          industry: l.industry || 'Not Analyzed',
          valueProposition: l.value_proposition || '',
          targetAudience: l.target_audience || '',
          painPoints: l.pain_points || [],
          hooks: l.hooks || [],
          status: l.status,
          emailSubject: l.email_subject || '',
          emailBody: l.email_body || ''
        }));
        setLeads(mapped);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await supabase.auth.signOut();
    }
  };

  // Profile save helper (passed to settings)
  const handleSaveProfile = async (newProfile, newApiKey) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          sender_name: newProfile.senderName,
          sender_title: newProfile.senderTitle,
          sender_company: newProfile.senderCompany,
          sender_product_desc: newProfile.senderProductDesc,
          gemini_api_key: newApiKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
      
      if (error) throw error;
      setUserProfile(newProfile);
      setApiKey(newApiKey);
    } catch (err) {
      console.error('Error saving profile:', err);
      throw err;
    }
  };

  // Navigate to a specific view with optional state
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const handleNavigateToOutreach = (leadId) => {
    setSelectedLeadId(leadId);
    setActiveView('outreach');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            leads={leads} 
            setLeads={setLeads}
            apiKey={apiKey}
            onNavigateToOutreach={handleNavigateToOutreach}
            session={session}
            isPremium={isPremium}
          />
        );
      case 'leads':
        return (
          <LeadManager 
            leads={leads} 
            setLeads={setLeads} 
            apiKey={apiKey}
            onNavigateToOutreach={handleNavigateToOutreach}
            session={session}
            isPremium={isPremium}
          />
        );
      case 'outreach':
        return (
          <OutreachStudio 
            leads={leads} 
            setLeads={setLeads} 
            selectedLeadId={selectedLeadId}
            setSelectedLeadId={setSelectedLeadId}
            userProfile={userProfile}
            apiKey={apiKey}
            session={session}
          />
        );
      case 'settings':
        return (
          <SettingsComponent 
            apiKey={apiKey} 
            setApiKey={setApiKey}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            onSaveProfile={handleSaveProfile}
            isPremium={isPremium}
            setIsPremium={setIsPremium}
            session={session}
          />
        );
      default:
        return <Dashboard leads={leads} />;
    }
  };

  // Auth Loading Screen
  if (loadingAuth) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        color: 'var(--text-muted)'
      }}>
        <Loader className="spinner" size={24} style={{ borderTopColor: 'var(--primary)' }} />
        <span>Syncing workspace...</span>
      </div>
    );
  }

  // Not Logged In Screen
  if (!session) {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <Auth />
      </div>
    );
  }

  // Logged In Shell
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">OutreachFlow AI</span>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutDashboard /> Dashboard
          </button>
          <button 
            className={`nav-link ${activeView === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveView('leads')}
          >
            <Users /> Lead Manager
          </button>
          <button 
            className={`nav-link ${activeView === 'outreach' ? 'active' : ''}`}
            onClick={() => setActiveView('outreach')}
          >
            <Mail /> Outreach Studio
          </button>
          <button 
            className={`nav-link ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <SettingsIcon /> Settings
          </button>
        </nav>

        {/* Upgrade Card for Free Accounts */}
        {!isPremium && (
          <div style={{
            margin: '1.5rem 0.5rem 1rem 0.5rem',
            padding: '1rem',
            background: 'rgba(0, 113, 227, 0.05)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(0, 113, 227, 0.12)',
            textAlign: 'center'
          }}>
            <h5 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--primary)' }}>Upgrade to Pro</h5>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.3' }}>Unlock unlimited AI research and B2B email drafts</p>
            <a 
              href="https://buy.stripe.com/dRmfZg62Y98S556cBq9k400" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem' }}
            >
              Upgrade Plan
            </a>
          </div>
        )}

        <div className="user-widget" style={{ flexDirection: 'column', gap: '0.75rem', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="avatar">
              {userProfile.senderName ? userProfile.senderName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info" style={{ flexGrow: 1 }}>
              <span className="user-name">{userProfile.senderName || session.user.email.split('@')[0]}</span>
              <span className="user-role">{userProfile.senderTitle || 'Outreach Specialist'}</span>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="btn btn-secondary btn-sm"
            style={{ 
              display: 'flex', 
              gap: '0.4rem', 
              justifyContent: 'center',
              padding: '0.4rem',
              width: '100%',
              fontSize: '0.8rem',
              borderColor: 'rgba(0,0,0,0.1)'
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-tabs">
        <button 
          className={`mobile-tab-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          <LayoutDashboard />
          <span>Dashboard</span>
        </button>
        <button 
          className={`mobile-tab-btn ${activeView === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveView('leads')}
        >
          <Users />
          <span>Leads</span>
        </button>
        <button 
          className={`mobile-tab-btn ${activeView === 'outreach' ? 'active' : ''}`}
          onClick={() => setActiveView('outreach')}
        >
          <Mail />
          <span>Outreach</span>
        </button>
        <button 
          className={`mobile-tab-btn ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          <SettingsIcon />
          <span>Settings</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
