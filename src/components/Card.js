import React, { useState } from "react";
import "./Card.css";
import { motion } from "framer-motion";

const Card = ({
  bill_number,
  bill_type,
  intro_date,
  description,
  passed,
  vetoed,
  last_recorded_action,
  last_recorded_action_date,
  full_status,
  sponsors = [], // Ensure it's an array
  statuses = [] // Ensure it's an array
}) => {
  
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCopy = () => {
    const textToCopy = `Bill Number: ${bill_number}\nDescription: ${description}\nSponsors: ${sponsors.join(
      ", "
    )}`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert("Text copied to clipboard");
      })
      .catch(err => {
        console.error("Failed to copy text: ", err);
      });
  };

  const billNumberToLink = bill_number => {
    return `https://legislature.vermont.gov/bill/status/2026/${bill_number.substring(
      0,
      1
    )}${bill_number.substring(2)}`;
  };

  const ChamberLetterToChamber = bill_type => {
    return bill_type === "H." ? "House" : "Senate";
  };

  return (
    <motion.div
      className="card"
      layout
      onClick={handleToggle}
      transition={{ duration: 0.5, ease: "linear" }} // Smooth card layout animation
    >
      {/* Top Container */}
      <motion.div
        className="top-container"
        layout="position"
        transition={{ duration: 0.5, ease: "linear" }}
      >
        <motion.h3 className="bill-num" layout="position">
          Bill {bill_number}
        </motion.h3>

        <motion.p className="date-intro" layout="position">
          {intro_date}
        </motion.p>

        <button className="link">
          <a href={billNumberToLink(bill_number)} target="_blank" rel="noopener noreferrer">Link</a>
        </button>
      </motion.div>

      {/* Description */}
      <motion.p
        className="description"
        layout="position"
        transition={{ duration: 0.5, ease: "linear" }}
      >
        {isExpanded ? description : `${description.substring(0, 100)}...`}
      </motion.p>

      {/* Expanding Content */}
      <motion.div
        className="content"
        initial={{ height: 0 }}
        animate={{ height: isExpanded ? "auto" : 0 }}
        exit={{ height: 0 }}
        transition={{ duration: 0.5, ease: "linear" }}
        style={{ overflow: "hidden" }}
      >
        {isExpanded && (
          <>
            {/* Chamber & Sponsors Section */}
            <motion.div className="sponsors" layout>
              <h4>Chamber</h4>
              <p>{ChamberLetterToChamber(bill_type)}</p>

              <h4>Sponsors</h4>
              {sponsors.length > 0 ? (
                <ul>
                  {sponsors.map((sponsor, index) => (
                    <li key={index}>{sponsor}</li>
                  ))}
                </ul>
              ) : (
                <p>No sponsors listed.</p>
              )}
            </motion.div>

            {/* Actions Section */}
            <motion.div className="actions" layout>
              <h4>Actions</h4>
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {statuses.length > 0 ? (
                    statuses.map((status, index) => (
                      <tr key={index}>
                        <td>{status.action_status}</td>
                        <td>{status.action_date}</td>
                        {console.log(status)}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">No recorded actions.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>

            {/* Copy Button */}
            <motion.div className="btn-container" layout>
              <button onClick={handleCopy}>Copy Info</button>
            </motion.div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Card;
