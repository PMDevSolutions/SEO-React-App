import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WebflowProvider } from './contexts/WebflowContext';
import { registerExtension } from '@webflow/extensions';

// Webflow Extension Registration
registerExtension({
  id: 'my-react-extension',
  name: 'My React Extension',
  icon: 'path/to/icon.svg', // Replace with your extension icon
  init(webflow) {
    // Create root and render app
    const rootElement = document.getElementById('root');
    if (rootElement) {
      ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
          <WebflowProvider initialWebflow={webflow}>
            <App />
          </WebflowProvider>
        </React.StrictMode>
      );
    }
  }
});