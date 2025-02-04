import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Choose the root container for the extension's main UI
const rootContainer = document.getElementById('extensions_settings');
const rootElement = document.createElement('div');
rootContainer.appendChild(rootElement);

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
