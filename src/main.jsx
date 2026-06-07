import React from "react";
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './components/Usercontext.jsx'
import { ChatProvider } from './Context/ChatContext.jsx'

window.addEventListener('error', (ev) => {
  const el = document.createElement('pre');
  el.style.cssText = 'position:fixed;inset:0;background:#fff;color:#c00;padding:24px;font:12px monospace;z-index:999999;overflow:auto;white-space:pre-wrap;';
  el.textContent = 'Runtime Error:\n' + (ev.message || 'Unknown') + '\n' + (ev.filename || '') + ':' + (ev.lineno || '');
  document.body.appendChild(el);
});

window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled:', ev.reason);
});

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Boundary:', error, info.componentStack); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, background: '#fff', color: '#000', font: '12px monospace', height: '100vh', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          <h1>Render Error</h1>
          <p>{this.state.error.toString()}</p>
          <details><summary>Stack</summary><pre>{this.state.error.stack}</pre></details>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <UserProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </UserProvider>
    </BrowserRouter>
  </ErrorBoundary>
)
