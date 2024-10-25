import React, { useState, useCallback } from 'react';

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';

import './App.css';

import CardList from './components/CardList'
import Start from './pages/Start'

function App() {
  //<Map/>
  
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Start/>}/>
        <Route path='/legislature' element={<CardList/>}/>
      </Routes>
    </Router>
  );
}

export default App;
