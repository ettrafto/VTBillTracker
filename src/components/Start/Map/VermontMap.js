import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const Map = () => {
  const svgRef = useRef();
  const [districtsData, setDistrictsData] = useState();
  const [townDistrictsData, setTownDistrictsData] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
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
      .attr('stroke', '#000')
      .attr('fill', 'none')  // No fill, only outline for towns
      .attr('stroke-width', 1)
      .on('mouseover', function (event, d) {
        console.log("Mouseover event fired for: ", d.properties.TOWNNAMEMC); // Debugging
        // Show tooltip and update with the town name
        setTooltipContent(d.properties.TOWNNAMEMC);  // Assuming the town name is stored in 'name'
        setTooltipVisible(true);
      })
      .on('mousemove', function (event) {
        console.log("Mousemove event fired at: ", event.pageX, event.pageY); // Debugging
        // Move tooltip with the mouse
        setTooltipPosition({ x: event.pageX, y: event.pageY });
      })
      .on('mouseout', function () {
        console.log("Mouseout event fired"); // Debugging
        // Hide tooltip when not hovering
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

  return (
    <div style={{ position: 'relative' }}> {/* Ensure container is relative for absolute tooltip positioning */}
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
          {tooltipContent}
        </div>
      )}
      {selectedDistricts.length > 0 && (
        <div>
          <h2>Selected Districts: {selectedDistricts.join(', ')}</h2>
        </div>
      )}
    </div>
  );
};

export default Map;
