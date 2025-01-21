import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Initialize SQL.js
const initSqlJs = async () => {
  const SQL = await window.initSqlJs({
    locateFile: fileName => `/sql-wasm.wasm`, // Adjust to the location of your wasm file
  });

  // Example SQLite operations
  const db = new SQL.Database();
  db.run("CREATE TABLE test (id INTEGER, name TEXT);");
  db.run("INSERT INTO test (id, name) VALUES (1, 'Alice');");
  const results = db.exec("SELECT * FROM test;");
  console.log("SQLite Query Results:", results);
};

// Load SQL.js and start the React app
const startApp = async () => {
  await initSqlJs(); // Ensure SQL.js is initialized before rendering the app

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

startApp();

// Performance metrics (optional)
reportWebVitals();
