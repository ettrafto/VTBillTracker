import React, { useState, useCallback, useContext } from 'react';

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';

import './App.css';

import CardList from './components/CardList'
import Start from './pages/Start'
import { StateProvider } from './util/StateProvider';



function App() {
  
  return (
    <StateProvider>
      <Router>
        <Routes>
            <Route path='/' element={<Start/>}/>
            <Route path='/legislature' element={<CardList/>}/>
        </Routes>
      </Router>
    </StateProvider>

  );
}

export default App;
