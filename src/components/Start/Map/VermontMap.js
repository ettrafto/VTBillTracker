import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useNavigate } from "react-router-dom";



import './VermontMap.css';
import { RepData } from '../../../util/RepData';
import { SenatorData } from '../../../util/SenatorData';
import { townToDistrict } from '../../../util/townToDistrict';


const Map = ({/*selectedDistricts, setSelectedDistricts, selectedSenateDistricts, setSelectedSenateDistricts*/}) => {
  const navigate = useNavigate();

  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedSenateDistricts, setSelectedSenateDistricts] = useState([]);

  const svgRef = useRef();
  const [districtsData, setDistrictsData] = useState();
  const [townDistrictsData, setTownDistrictsData] = useState([]);

  const [selectedTowns, setSelectedTowns] = useState([]);
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
      .center([-72.577841, 44.0886])
      .scale(10000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);


    // Draw town districts (background layer)
    svg.selectAll('path.town')
      .data(townDistrictsData.features)
      .join('path')
      .attr('class', 'town')
      .attr('d', path)
      .attr('stroke', 'gray')
      .attr('fill', '#000fff00')  
      .attr('stroke-width', 1)
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

  }, [districtsData, townDistrictsData, selectedDistricts]);

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
}, [selectedDistricts, RepData]);

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


  return (
    <div className='selection-container'>
    <div className='selection-map' > {/* Ensure container is relative for absolute tooltip positioning */}
      <svg ref={svgRef}></svg>
      {tooltipVisible && (
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
      )}
    </div>
      <div className='selected-data-container'>
        <h3 className='selected-data-title'>Selected Districts & Reps</h3>
      <div className='selected-data'>
      {selectedDistricts.length > 0 && (
        <div className='selected-districts'>
          <h2>Districts: {selectedDistricts.join(', ')}</h2>
          <h2>Towns: {selectedTowns.join(', ')}</h2>


          <h3>Representatives:</h3>
          <div>
            {selectedDistricts.map(element =>
              RepData.filter(item => item[0] === element).map(rep => (
                <div key={`${rep[0]}-${rep[1]}`}>
                  <strong>{rep[1]}</strong> - Party: {rep[3]}
                </div>
              ))
            )}
          </div>

          <h3>Senators:</h3>
          <div>
            {selectedSenateDistricts.map((senateDistrict) =>
              SenatorData.filter((item) => item[0] === senateDistrict).map((senator) => (
                <div key={`${senator[0]}-${senator[1]}`}>
                  <strong>{senator[1]}</strong> - Party: {senator[2]}
                </div>
              ))
            )}
          </div>
          <button onClick={handleProceed}>View Legislature Data</button>

        </div>
      )}
    </div>
    </div>
    </div>


  );
};

export default Map;
