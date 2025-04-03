import React from 'react';
import logo from './logo.svg';
import './App.css';
import MesPage from './modules/machine_page/MesPage';
import AuthPage from './modules/auth/AuthPage';
import MasterPage from './modules/master_page/MasterPage';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <MasterPage/>

      </header>
    </div>
  );
}

export default App;
