import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import Map from "../components/Start/Map/VermontMap";

const StartScreen = () => {
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const navigate = useNavigate();


  const handleDistrictSelection = (district) => {
    // Add or remove districts from selectedDistricts state
    if (selectedDistricts.includes(district)) {
      setSelectedDistricts(selectedDistricts.filter((d) => d !== district));
    } else {
      setSelectedDistricts([...selectedDistricts, district]);
    }
  };

  const handleProceed = () => {
    // Navigate to legislature data screen, passing selected districts as state
    navigate("/legislature", { state: { selectedDistricts } });
  };

  return (
    <div>
      <h1>Select Districts</h1>
      <Map/>
      <div>
        
      </div>
      <button onClick={handleProceed}>View Legislature Data</button>
    </div>
  );
};

export default StartScreen;
