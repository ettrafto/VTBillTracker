import React, { useState } from "react";
import "./Card.css";
import { motion } from "framer-motion";

const Card = ({ bill_number,bill_page, intro_date, description, local_sponsors, actions }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCopy = () => {
    const textToCopy = `Bill Number: ${bill_number}\nDescription: ${description}\nLocal Sponsors: ${local_sponsors.join(", ")}`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('Text copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <motion.div
      className="card"
      layout
      onClick={handleToggle}
    >
    <motion.div className="top-container">
        <motion.h3 layout="position" className="bill-num">
            Bill {bill_number}

        </motion.h3>

        <motion.p layout="position" className="date-intro">
            {intro_date}
        </motion.p>

        <button className="link"><a href={bill_page}>Link</a></button>


      </motion.div>
      <motion.p layout="position" className="description">
        {isExpanded ? description : `${description.substring(0, 1000)}`}
      </motion.p>

      <motion.div
        className="content"
        initial={{ height: 0 }}
        animate={{ height: isExpanded ? "auto" : 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: "hidden" }}
      >
        {isExpanded && (
          <>
          


            <motion.div className="sponsors">
              <h4>Local Sponsors</h4>
              <ul>
                {local_sponsors.map((sponsor, index) => (
                  <li key={index}>{sponsor}</li>
                ))}
              </ul>
            </motion.div>

            <motion.div className="actions">
              <h4>Actions</h4>
              <table>
                <thead>
                  <tr>
                    <th>Body</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((action, index) => (
                    <tr key={index}>
                      <td>{action.body}</td>
                      <td>{action.date}</td>
                      <td>{action.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <motion.div className="btn-container">
              <button onClick={handleCopy}>Copy Info</button>
            </motion.div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Card;
