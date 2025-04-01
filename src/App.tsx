import React from 'react';
import logo from './logo.svg';
import './App.css';
import MesPage from './modules/machine_page/MesPage';
import AuthPage from './modules/auth/AuthPage';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <MesPage/>

      </header>
    </div>
  );
}

export default App;
