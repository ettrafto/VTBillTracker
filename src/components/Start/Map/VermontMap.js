import React, { useEffect, useRef, useState, useContext } from 'react';
import * as d3 from 'd3';
import { useNavigate } from "react-router-dom";


import { StateContext } from '../../../util/StateProvider';

import Footer from '../../all/Footer';
import './VermontMap.css';
import { RepData } from '../../../util/RepData';
import { SenatorData } from '../../../util/SenatorData';
import { townToDistrict } from '../../../util/townToDistrict';
import TownSelector from '../TownSelector';
import Modal from '../Modal/Modal';


const Map = () => {
  const navigate = useNavigate();

  const { selectedDistricts,selectedSenateDistricts, setSelectedDistricts, setSelectedSenateDistricts } = useContext(StateContext);

  const svgRef = useRef();
  const [mapZoom, setMapZoom] = useState({
    center: [-72.577841, 44.0886], // Default center
    scale: 10000, // Default scale
  });
  
  const [districtsData, setDistrictsData] = useState();
  const [townDistrictsData, setTownDistrictsData] = useState([]);

  const [selectedTowns, setSelectedTowns] = useState([]);
  const [TownToolSelection, setTownToolSelection] = useState([]);
  const [showModal, setShowModal] = useState(false);


  const [tooltipContent, setTooltipContent] = useState(''); // Tooltip content
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }); // Tooltip position
  const [tooltipVisible, setTooltipVisible] = useState(false); // Tooltip visibility

  useEffect(() => {
    // Fetch town and district data concurrently
    Promise.all([
      fetch('data/vt.geojson').then(response => response.json()),
      fetch('data/vtDistricts.geojson').then(response => response.json())
    ])
      .then(([townData, districtData]) => {
        setTownDistrictsData(townData);
        setDistrictsData(districtData);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  useEffect(() => {
    if (!districtsData || !townDistrictsData) return;

    const width = 800;
    const height = 700;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const projection = d3.geoMercator()
      .center(mapZoom.center)
      .scale(mapZoom.scale)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);


    // Draw town districts (background layer)
    svg.selectAll('path.town')
      .data(townDistrictsData.features)
      .join('path')
      .attr('class', 'town')
      .attr('d', path)
      .attr('stroke', 'gray')
      .attr('fill', d => {
        const townName = d.properties.TOWNNAMEMC;
        return townName === TownToolSelection ? '#ff0000' : '#000fff00';
      })      .attr('stroke-width', 1)
      .on('mouseover', function (event, d) {
        console.log("Mouseover event fired for: ", d.properties.TOWNNAMEMC); // Debugging
        setTooltipContent(d.properties.TOWNNAMEMC);  // Show town name in tooltip
        setTooltipVisible(true);
      })
      .on('mousemove', function (event) {
        console.log("Mousemove event fired at: ", event.pageX, event.pageY); // Debugging
        // Adjust the position of the tooltip with the mouse movement
        setTooltipPosition({
          x: event.pageX, 
          y: event.pageY
        });
      })
      .on('mouseout', function () {
        console.log("Mouseout event fired"); // Debugging
        setTooltipVisible(false);
      });

  // Draw state districts (foreground layer)
  svg.selectAll('path.district')
    .data(districtsData.features)
    .join('path')
    .attr('class', 'district')
    .attr('d', path)
    .attr('stroke', '#000')  // Black stroke for state districts
    .attr('fill', d => selectedDistricts.includes(d.properties.name) ? '#FFA50099' : '#FFFFFF99')  // Translucent fill
    .on('click', function (event, d) {
      const districtName = d.properties.name;
      setSelectedDistricts(prevSelected => {
        if (prevSelected.includes(districtName)) {
          return prevSelected.filter(item => item !== districtName);
        } else {
          return [...prevSelected, districtName];
        }
      });
    })
    .on('mouseover', function (event, d) {
      if (!selectedDistricts.includes(d.properties.name)) {
        d3.select(this).attr('fill', '#ADD8E699');  // Light blue on hover
      }
    })
    .on('mouseout', function (event, d) {
      if (!selectedDistricts.includes(d.properties.name)) {
        d3.select(this).attr('fill', '#FFFFFF99');  // Revert to translucent white
      }
    });

  }, [districtsData, townDistrictsData, selectedDistricts, mapZoom, TownToolSelection]);

//helper function to update selected towns and senate districts based on selected districts
useEffect(() => {
  const updateSelectedTowns = () => {
    const townsSet = new Set();

    // Loop through selected districts and collect towns
    selectedDistricts.forEach((district) => {
      RepData.filter((rep) => rep[0] === district).forEach((rep) => {
        rep[2].forEach((town) => townsSet.add(town));
      });
    });

    // Update the state with the unique towns
    setSelectedTowns(Array.from(townsSet));
  };

  updateSelectedTowns(); // Call the function to update selectedTowns
}, [selectedDistricts, RepData, TownToolSelection]);

useEffect(() => {
  const updateSelectedSenatorDistricts = () => {
    const districtSet = new Set();

    // Loop through selected towns and collect senator districts
    selectedTowns.forEach((town) => {
      townToDistrict
        .filter(([townName]) => townName === town)
        .forEach(([, district]) => districtSet.add(district));
    });

    // Update the state with the unique senator districts
    setSelectedSenateDistricts(Array.from(districtSet));
  };

  updateSelectedSenatorDistricts(); // Call the function to update selectedSenatorDistricts
}, [selectedTowns, townToDistrict]);

const handleProceed = () => {
  // Navigate to legislature data screen, passing selected districts as state
  navigate("/legislature", { state: { selectedDistricts, selectedSenateDistricts } });
};

console.log("Selected Districts: ", selectedDistricts);


  const handleDistrictSelection = (district) => {
    // Add or remove districts from selectedDistricts state
    if (selectedDistricts.includes(district)) {
      setSelectedDistricts(selectedDistricts.filter((d) => d !== district));
    } else {
      setSelectedDistricts([...selectedDistricts, district]);
    }
  };

  const handleView = (view) => {
    if (view === 'All') {
      setMapZoom({
        center: [-72.5041, 43.9746], // Default center
        scale: 12500, // Default scale
      });
    } else if (view === 'Rutland') {
      setMapZoom({
        center: [-73.0121, 43.6106], // Center for Rutland
        scale: 120000, // Adjusted scale for Rutland
      });
    } else if (view === 'Burlington') {
      setMapZoom({
        center: [-73.1348, 44.4701], // Center for Burlington
        scale: 120000, // Adjusted scale for Burlington
      });
    }
  };


  return (
    <>
    <div className='selection-container'>
      
      <div className='selection-map' > {/* Ensure container is relative for absolute tooltip positioning */}
        <svg ref={svgRef}></svg>
        {/*TOOLTIP*/}
        <div className='zoom-buttons'>  
          <img className='view-icon' src="/images/view-icon.svg"/>
          <button className='view-all' onClick={() => handleView('All')} >View All</button>
          <button className='view-rutland' onClick={() => handleView('Rutland')}>Rutland</button>
          <button className='view-burlington' onClick={() => handleView('Burlington')}>Burlington</button>
        </div>
        
        <div/>
      </div>
      <div className='right-menu'>    
        <div className='selected-data-container'>
          

          <div className='selected-data'>
          {selectedDistricts.length > 0 ? (

          <h3 className='selected-data-title'>Selected Districts, Towns & Reps</h3>
          ) : ("")}

          {selectedDistricts.length > 0 ? (
            <div className='selected-districts'>
              <h2>Districts: {selectedDistricts.join(', ')}</h2>
              <h2>Towns: {selectedTowns.join(', ')}</h2>

              <hr />

              <h3>Representatives:</h3>
              <div>
                {selectedDistricts.map(element =>
                  RepData.filter(item => item[0] === element).map(rep => (
                    <div key={`${rep[0]}-${rep[1]}`}>
                      <strong>{rep[1]}</strong> -  {rep[3]}
                    </div>
                  ))
                )}
              </div>

              <h3>Senators:</h3>
              <div>
                {selectedSenateDistricts.map((senateDistrict) =>
                  SenatorData.filter((item) => item[0] === senateDistrict).map((senator) => (
                    <div key={`${senator[0]}-${senator[1]}`}>
                      <strong>{senator[1]}</strong> -  {senator[2]}
                    </div>
                  ))
                )}
              </div>
              <button onClick={handleProceed}>View Legislature Data</button>

            </div>
          ): (
            <div className="no-districts">
              <h2>Welcome to VTBillTracker.org!</h2>
              <p>This tool is designed to assist Vermont citizens <br/>in tracking the activities of their local legislators.</p>
              <p>You can highlight your town for easier <br/> selection by using the button above!</p>
              <p>Select a district on the map to get started.</p>
            </div>
          )}

        </div>
    </div>
    <div className='selection-town-tool'>
          
            <button onClick={() => setShowModal(true)} className='town-tool-button'>Find Your Town</button>
            <h2 className='town-tool-output'>Highlighted Town: {TownToolSelection || "None"}</h2>

            <TownSelector setShowModal={setShowModal} showModal={showModal} TownToolSelection={TownToolSelection} setTownToolSelection={setTownToolSelection} />
    </div>
  </div>
</div>
<Footer/>
</>


  );
};
          {/*tooltipVisible && (
          <div
            className="tooltip"
            style={{
              position: 'absolute',
              top: tooltipPosition.y + 'px',
              left: tooltipPosition.x + 'px',
              background: 'white',
              padding: '5px',
              borderRadius: '5px',
              border: '1px solid black',
              pointerEvents: 'none', // Ensure it doesn't interfere with map interactions
              zIndex: 10 // Make sure it's above the map
            }}
          >
            {console.log("Tooltip rendering with content: ", tooltipContent)}
            {tooltipContent}
          </div>
          )*/}

export default Map;
