import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Mail, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import Dashboard from './components/Dashboard';
import LeadManager from './components/LeadManager';
import OutreachStudio from './components/OutreachStudio';
import SettingsComponent from './components/Settings';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  
  // Load settings & data from localStorage
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('of_gemini_api_key') || '';
  });
  
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('of_user_profile');
    return saved ? JSON.parse(saved) : {
      senderName: '',
      senderTitle: '',
      senderCompany: '',
      senderProductDesc: ''
    };
  });

  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('of_leads');
    // Seed some premium sample data if empty so the UI looks incredible on first launch!
    return saved ? JSON.parse(saved) : [
      {
        id: 'sample-1',
        companyName: 'Acme Corp',
        domain: 'acme.com',
        industry: 'SaaS / DevTools',
        valueProposition: 'Building automated developer pipelines for cloud migration.',
        targetAudience: 'Enterprise engineering managers',
        painPoints: ['Slow code deployment cycles', 'High cloud egress costs', 'Manual QA bottlenecks'],
        hooks: ['Impressive 40% growth in developer headcount last quarter', 'Shifting towards multi-cloud architecture'],
        status: 'completed',
        emailSubject: 'Automating Acme’s deployments in Q3?',
        emailBody: 'Hi Engineering Team,\n\nI noticed Acme is scaling dev workflows quickly. With your shift to multi-cloud, manual QA might bottleneck deployment velocity. Our team helps dev managers cut cycles by 60%.\n\nOpen to a quick 5-minute chat next Tuesday?\n\nBest,\nUser'
      },
      {
        id: 'sample-2',
        companyName: 'Apex Health',
        domain: 'apexhealth.io',
        industry: 'Healthcare Tech',
        valueProposition: 'Telehealth patient record compliance platform.',
        targetAudience: 'Private clinical networks',
        painPoints: ['Complex HIPAA compliance audits', 'Slow patient intake', 'Outdated EHR integrations'],
        hooks: ['Expanding to 3 new clinic locations next month', 'High-quality patient portal rating'],
        status: 'pending',
        emailSubject: '',
        emailBody: ''
      }
    ];
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem('of_gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('of_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('of_leads', JSON.stringify(leads));
  }, [leads]);

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
          />
        );
      case 'leads':
        return (
          <LeadManager 
            leads={leads} 
            setLeads={setLeads} 
            apiKey={apiKey}
            onNavigateToOutreach={handleNavigateToOutreach}
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
          />
        );
      case 'settings':
        return (
          <SettingsComponent 
            apiKey={apiKey} 
            setApiKey={setApiKey}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
          />
        );
      default:
        return <Dashboard leads={leads} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation (Desktop) */}
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

        <div className="user-widget">
          <div className="avatar">
            {userProfile.senderName ? userProfile.senderName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{userProfile.senderName || 'Active User'}</span>
            <span className="user-role">{userProfile.senderTitle || 'Outreach Specialist'}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
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

      {/* Main Content Area */}
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
