import React, { createContext, useState } from 'react';

// Create a Context
export const StateContext = createContext();

// Create a Provider Component
export const StateProvider = ({ children }) => {
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedSenateDistricts, setSelectedSenateDistricts] = useState([]);
  
  return (
    <StateContext.Provider value={{ selectedDistricts, setSelectedDistricts, selectedSenateDistricts, setSelectedSenateDistricts }}>
      {children}
    </StateContext.Provider>
  );
};
