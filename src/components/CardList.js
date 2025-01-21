import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';


import "./Card.css";
import "./CardList.css";
import Card from "./Card";
import { LayoutGroup } from "framer-motion";
import { RepData } from '../util/RepData';
import { SenatorData } from '../util/SenatorData';

const CardList = () => {


  const location = useLocation();
  const { selectedDistricts = [], selectedSenateDistricts = [] } = location.state || {};
  const [selectedReps, setSelectedReps] = useState([]);
  const [selectedSenators, setSelectedSenators] = useState([]);
  const [allNames, setAllNames] = useState([]);

  const [data, setData] = useState([]);
  const [sortOption, setSortOption] = useState("bill_number_asc");
  const [filteredData, setFilteredData] = useState(data);
  const [allSponsors, setAllSponsors] = useState([]);


  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cardsPerRow, setCardsPerRow] = useState(1); // State to control number of cards per row
  const [isDarkMode, setIsDarkMode] = useState(false); // State to manage dark mode


  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  //Converting props of selected districts + senatorDistricts to selected reps and senators
  const getSelectedReps = (selectedDistricts, RepData) => {
    const selectedReps = [];
    selectedDistricts.forEach((district) => {
      const reps = RepData.filter((item) => item[0] === district);
      const repNames = reps.map((rep) => rep[1]);
      selectedReps.push(...repNames);
  

    });
    return selectedReps;
  };
  
  const getSelectedSenators = (selectedSenateDistricts, SenatorData) => {
    const selectedSenators = [];
    selectedSenateDistricts.forEach((senateDistrict) => {
      const senators = SenatorData.filter((item) => item[0] === senateDistrict);
      const senatorNames = senators.map((senator) => senator[1]);
      selectedSenators.push(...senatorNames);

    });
    return selectedSenators;
  };

  useEffect(() => {
    const repNames = getSelectedReps(selectedDistricts, RepData);
    const senatorNames = getSelectedSenators(selectedSenateDistricts, SenatorData);
    setAllSponsors([...repNames, ...senatorNames]);
  }, [selectedDistricts, selectedSenateDistricts]);
  

 
  const sortData = (data) => {
    const sortedData = [...data];
    switch (sortOption) {
      case "bill_number_asc":
        return sortedData.sort((a, b) => (a.bill_number || "").localeCompare(b.bill_number || ""));
      case "bill_number_desc":
        return sortedData.sort((a, b) => (b.bill_number || "").localeCompare(a.bill_number || ""));
      case "date_asc":
        return sortedData.sort((a, b) => new Date(a.date_introduced || 0) - new Date(b.date_introduced || 0));
      case "date_desc":
        return sortedData.sort((a, b) => new Date(b.date_introduced || 0) - new Date(a.date_introduced || 0));
      default:
        return data;
    }
  };

  const filterBySponsor = (data) => {
    if (!allNames.length) return data; // Return all if no sponsors selected
    return data.filter((bill) => allNames.includes(bill.sponsor_name));
  };

  

  useEffect(() => {
    const sortedData = sortData(data);
    const filteredAndSortedData = filterBySponsor(sortedData);
    setFilteredData(filteredAndSortedData);
  }, [sortOption, allNames, bills]);

  const handleSponsorChange = (sponsor) => {
    setAllNames((prev) =>
      prev.includes(sponsor) ? prev.filter((s) => s !== sponsor) : [...prev, sponsor]
    );
  };
  
  

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleSortOption = (option) => {
    setSortOption((prev) =>
      prev === `${option}_asc` ? `${option}_desc` : `${option}_asc`
    );
  };

  const cycleView = () => {
    setCardsPerRow((prev) => (prev === 3 ? 2 : prev === 2 ? 1 : 3));
  };
/*
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };
*/

  
//loading data from DB to bills
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const SQL = await window.initSqlJs({
          locateFile: (file) => `/sqljs/${file}`,
        });
  
        const response = await fetch("/backend/database/legislature_data.db");
        const arrayBuffer = await response.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(arrayBuffer));
  
        // Combine and flatten the arrays of selected reps and senators
        const repNames = getSelectedReps(selectedDistricts, RepData);
        const senatorNames = getSelectedSenators(selectedSenateDistricts, SenatorData);
        setAllNames([...repNames, ...senatorNames]);

        // Build names placeholder with properly formatted names
        const namesPlaceholder = [...repNames, ...senatorNames]
        .map((name) => `'${name.replace(/'/g, "''")}'`) // Escape single quotes
        .join(", ");
        // console.log('names placeholder', namesPlaceholder); // Correctly formatted names

  
        // Dynamically construct the query
        const query = `
        SELECT  
            BILL.bill_number,
            BILL.title,
            BILL.type,
            BILL.date_introduced,
            BILL.passed,
            BILL.vetoed,
            STATUS.full_status AS last_recorded_action,
            STATUS.status_date,
            SPONSOR.first_name || ' ' || SPONSOR.last_name AS sponsor_name
        FROM 
            BILL
        JOIN 
            STATUS ON BILL.last_recorded_action_id = STATUS.id
        JOIN 
            SPONSORED ON BILL.bill_number = SPONSORED.bill_id
        JOIN 
            SPONSOR ON SPONSORED.sponsor_id = SPONSOR.id
        WHERE 
            (SPONSOR.first_name || ' ' || SPONSOR.last_name) IN (${namesPlaceholder})
        GROUP BY 
            BILL.bill_number, 
            BILL.title, 
            BILL.type, 
            BILL.date_introduced, 
            BILL.passed, 
            BILL.vetoed, 
            STATUS.full_status, 
            STATUS.status_date, 
            sponsor_name;
      `;
      
    
    //(${namesPlaceholder})
        //('Angela Arsenault', 'Erin Brady', 'Thomas Chittenden', 'Virginia "Ginny" Lyons', 'Kesha Ram Hinsdale');
        console.log("Executing query:", query); // Debugging log
  
        const result = db.exec(query);
  
        if (result.length > 0) {
          const rows = result[0].values.map((row) =>
            result[0].columns.reduce((acc, col, i) => {
              acc[col] = row[i];
              return acc;
            }, {})
          );
          setBills(rows);
          console.log('rows', rows);
          setData(rows);
        } else {
          console.log(namesPlaceholder)
          console.error("No results found");
          setBills([]);
        }
      } catch (err) {
        setError(err.message);
      }
    };
  
    loadDatabase();
  }, [selectedReps, selectedSenators]);
  
  
  return (
  <>

    <div className={isDarkMode ? "dark-mode" : ""}> 
      <div className="title">
        <h1>VT Bill Tracker</h1>
      </div>

      <div className="sorting-parent">
        <button onClick={() => toggleSortOption("bill_number")}>
          Sort by Bill Number {sortOption === "bill_number_asc" ? "▲" : "▼"}
        </button>
        <button onClick={() => toggleSortOption("date")}>
          Sort by Date {sortOption === "date_asc" ? "▲" : "▼"}
        </button>
        <button onClick={toggleDropdown}>Select Sponsors</button>
        <button onClick={cycleView}>Cycle View</button>
        {/*<button onClick={toggleDarkMode}>
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button> */}
      </div>
      

      {isDropdownOpen && (
        <div className="dropdown-menu">
          {allSponsors.map((sponsor) => (
            <div key={sponsor}>
              <input
                type="checkbox"
                id={`sponsor-${sponsor}`}
                checked={allNames.includes(sponsor)} // Reflect the selected state
                onChange={() => handleSponsorChange(sponsor)} // Update the selected state
              />
              <label htmlFor={`sponsor-${sponsor}`}>{sponsor}</label>
            </div>
          ))}
        </div>
      )}




      <div className={`cards cards-${cardsPerRow}`}>
        <LayoutGroup>
        {filteredData.map((bill, index) => (
            <Card
              key={index}
              bill_number={bill.bill_number}
              bill_type={bill.type}
              intro_date={bill.date_introduced}
              description={bill.title}
              passed={bill.passed ? "Yes" : "No"}
              vetoed={bill.vetoed ? "Yes" : "No"}
              last_recorded_action={bill.last_recorded_action}
              last_recorded_action_date={bill.status_date}
              full_status={bill.full_status}
              sponsor_name={bill.sponsor_name}
            />
          ))}
        </LayoutGroup>
      </div>
    </div>
    </>
  );
};

export default CardList;
