import React, { useState, useEffect } from "react";
import "./Card.css";
import "./CardList.css"

import Card from "./Card";
import { LayoutGroup } from "framer-motion";
import data from '../../backend/bills_data.json'; 

const CardList = () => {
  const [sortOption, setSortOption] = useState('bill_number_asc');
  const [filteredData, setFilteredData] = useState(data);
  const [selectedSponsors, setSelectedSponsors] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Extract unique sponsors from the data
    const allSponsors = new Set();
    data.forEach(bill => {
      bill.local_sponsors.forEach(sponsor => {
        allSponsors.add(sponsor);
      });
    });
    setSponsors([...allSponsors]);
  }, []);

  const sortData = (data) => {
    const sortedData = [...data];
    switch (sortOption) {
      case 'bill_number_asc':
        return sortedData.sort((a, b) => a.bill_number.localeCompare(b.bill_number));
      case 'bill_number_desc':
        return sortedData.sort((a, b) => b.bill_number.localeCompare(a.bill_number));
      case 'date_asc':
        return sortedData.sort((a, b) => new Date(a.actions[0].date) - new Date(b.actions[0].date));
      case 'date_desc':
        return sortedData.sort((a, b) => new Date(b.actions[0].date) - new Date(a.actions[0].date));
      default:
        return data;
    }
  };

  const filterBySponsor = (data) => {
    if (selectedSponsors.length === 0) return data;
    return data.filter(bill =>
      bill.local_sponsors.some(sponsor => selectedSponsors.includes(sponsor))
    );
  };

  useEffect(() => {
    const sortedData = sortData(data);
    const filteredAndSortedData = filterBySponsor(sortedData);
    setFilteredData(filteredAndSortedData);
  }, [sortOption, selectedSponsors]);

  const handleSponsorChange = (sponsor) => {
    setSelectedSponsors(prev =>
      prev.includes(sponsor)
        ? prev.filter(s => s !== sponsor)
        : [...prev, sponsor]
    );
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleSortOption = (option) => {
    setSortOption(prev => 
      prev === `${option}_asc` ? `${option}_desc` : `${option}_asc`
    );
  };

  console.log(filteredData[0].actions[0].date);

  return (
    <>
      <div className="title">
        <h1>Local Vermont Legislature Data</h1>
      </div>


      <div className="sorting-parent">
        <button onClick={() => toggleSortOption('bill_number')}>
          Sort by Bill Number {sortOption === 'bill_number_asc' ? '▲' : '▼'}
        </button>
        <button onClick={() => toggleSortOption('date')}>
          Sort by Date {sortOption === 'date_asc' ? '▲' : '▼'}
        </button>
        <button onClick={toggleDropdown}>
          Select Sponsors
        </button>
      </div>
      {isDropdownOpen && (
          <div className="dropdown-menu">
            {sponsors.map((sponsor, index) => (
              <div key={index}>
                <input
                  type="checkbox"
                  id={`sponsor-${index}`}
                  value={sponsor}
                  onChange={() => handleSponsorChange(sponsor)}
                />
                <label htmlFor={`sponsor-${index}`}>{sponsor}</label>
              </div>
            ))}
          </div>
        )}

      <div className="cards">
      <LayoutGroup >
        {filteredData.map((cardData, index) => (
          <Card
            key={index}
            bill_number={cardData.bill_number}
            bill_page={cardData.bill_page}
            intro_date={cardData.actions[0].date}
            description={cardData.description}
            local_sponsors={cardData.local_sponsors}
            actions={cardData.actions}
          />
        ))}
      </LayoutGroup>
      </div>
    </>
  );
};

export default CardList;
