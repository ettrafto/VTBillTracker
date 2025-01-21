import React, { useState } from "react";

import Map from "../components/Start/Map/VermontMap";

const StartScreen = () => {

/*        selectedDistricts={selectedDistricts}
        setSelectedDistricts={setSelectedDistricts}
        selectedSenateDistricts={selectedSenateDistricts}
        setSelectedSenateDistricts={setSelectedSenateDistricts}
        */

 
  return (
    <div>
      <h1 className='title'>VTBillChecker.org</h1>
      <Map

      />
    </div>
  );
};

export default StartScreen;
