import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Mail, Lock, ShieldAlert, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        
        // Supabase sends a confirmation email by default unless configured otherwise.
        if (data?.user && data.user.identities?.length === 0) {
          setErrorMsg("This email is already registered. Try logging in instead.");
        } else {
          setSuccessMsg("Check your inbox for a verification email to complete your registration!");
          setEmail('');
          setPassword('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '1rem'
    }} className="fade-in">
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2.5rem 2rem',
        background: '#ffffff',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
        border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          background: '#1d1d1f',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '1.25rem'
        }}>
          ⚡
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '0.25rem',
          letterSpacing: '-0.02em'
        }}>
          {isSignUp ? "Create your account" : "Sign in to OutreachFlow"}
        </h2>
        
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          marginBottom: '2rem'
        }}>
          {isSignUp ? "Start researching leads and writing AI emails" : "Welcome back. Enter your credentials to continue"}
        </p>

        {errorMsg && (
          <div className="api-notice-box" style={{
            background: 'rgba(255, 59, 48, 0.05)',
            borderColor: 'rgba(255, 59, 48, 0.15)',
            color: 'var(--danger)',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem' }}>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="api-notice-box" style={{
            background: 'rgba(52, 199, 89, 0.08)',
            borderColor: 'rgba(52, 199, 89, 0.15)',
            color: '#1a7f37',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem' }}>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                {isSignUp ? "Sign Up" : "Sign In"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
