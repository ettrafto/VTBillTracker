import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Vttowns } from '../../util/Towns';

const mountElement = document.getElementById("modal-root");

const TownSelector = ({ showModal, setShowModal, TownToolSelection, setTownToolSelection }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTowns, setFilteredTowns] = useState(Vttowns);

  const handleFindTown = () => {
    setShowModal(true);
    setSearchTerm("");
    setFilteredTowns(Vttowns);
  };

  const handleSearchChange = (e) => {
    const search = e.target.value.toLowerCase();
    setSearchTerm(search);
    setFilteredTowns(
      Vttowns.filter((town) => town.toLowerCase().includes(search))
    );
  };

  const handleSelectTown = (town) => {
    setTownToolSelection(town);
    setShowModal(false);
  };

  return (
    <div>
      {/* Modal inside React Portal */}
      {showModal &&
        createPortal(
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Select Your Town</h3>
              <input
                type="text"
                placeholder="Search for your town..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="modal-search"
              />
              <ul className="town-list">
                {filteredTowns.map((town, index) => (
                  <li key={index} onClick={() => handleSelectTown(town)}>
                    {town}
                  </li>
                ))}
              </ul>
              <button className="close-button" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>,
          mountElement
        )}
    </div>
  );
};

export default TownSelector;
