import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'mapbox-gl/dist/mapbox-gl.css';
import { client } from "@sigmacomputing/plugin";

// Initialize app with proper error handling
function initializeApp() {
  console.log('Starting app initialization...');
  const root = document.getElementById('root');
  
  if (!root) {
    console.error('Root element not found!');
    return;
  }

  try {
    // Initialize React app
    console.log('Initializing React app...');
    
    // Create error boundary wrapper
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      componentDidCatch(error, info) {
        console.error('React error caught:', error);
        console.error('Component stack:', info.componentStack);
      }

      render() {
        if (this.state.hasError) {
          return (
            <div style={{ padding: 20, color: '#c62828', background: '#ffebee' }}>
              <h2>Failed to initialize application</h2>
              <pre>{this.state.error?.message}</pre>
              <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
                Debug Info:
                <br />In iframe: {window.parent !== window ? 'Yes' : 'No'}
                <br />Location: {window.location.href}
                <br />Sigma client: {!!client ? 'Yes' : 'No'}
              </div>
            </div>
          );
        }
        return this.props.children;
      }
    }

    ReactDOM.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
      root
    );
    console.log('React app initialized successfully');

    // Listen for Sigma messages
    if (window.parent !== window) {
      console.log('Running in Sigma iframe, setting up message listener...');
      window.addEventListener('message', (event) => {
        // Log all messages for debugging
        console.log('Received message:', event.origin, event.data);
      });
    } else {
      console.log('Running in direct browser mode');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
    root.innerHTML = `
      <div style="padding: 20px; color: #c62828; background: #ffebee">
        <h2>Failed to initialize application</h2>
        <pre>${error.message}</pre>
        <div style="margin-top: 20px; font-size: 12px; color: #666;">
          Debug Info:
          <br>In iframe: ${window.parent !== window}
          <br>Location: ${window.location.href}
          <br>Sigma client: ${!!client}
        </div>
      </div>
    `;
  }
}

// Start initialization
initializeApp();

// Initialize performance monitoring
reportWebVitals();
