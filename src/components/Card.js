import React, { useState } from "react";
import "./Card.css";
import { motion } from "framer-motion";
import { easeBackOut } from "d3";

              {/* 
                
              bill_number={bill.bill_number}
              bill_type={bill.type}
              intro_date={bill.date_introduced}
              description={bill.title}
              passed={bill.passed ? "Yes" : "No"}
              vetoed={bill.vetoed ? "Yes" : "No"}
              last_recorded_action={bill.last_recorded_action}
              last_recorded_action_date={bill.status_date}
              full_status={bill.full_status}

              //TO-DO
               - get multiple status' and sponsors
                */}

const Card = ({ bill_number, bill_type, intro_date, description, passed, vetoed, last_recorded_action, last_recorded_action_date, full_status,sponsor_name }) => {
  
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCopy = () => {
    const textToCopy = `Bill Number: ${bill_number}\nDescription: ${description}\nLocal Sponsors: ${sponsor_name}`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('Text copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  const billNumberToLink = (bill_number) => {
    let link = 'https://legislature.vermont.gov/bill/status/2026/' + 
    bill_number.substring(0, 1) + 
    bill_number.substring(2);
    return link; 
  }
  const ChamberLetterToChamber = (bill_type) => {
    console.log(bill_type);
    if (bill_type === 'H.') {
      return 'House';
    } else {
      return 'Senate';
    }
  }

  return (
    <motion.div
      className="card"
      layout
      onClick={handleToggle}
      // transition={{ ease: isExpanded ? "linear" : "linear" }}
    >
    <motion.div className="top-container"
            transition={{ duration: 0.3, ease: isExpanded ? 'linear' : 'linear' }}
>
        <motion.h3 layout="position" className="bill-num"
        >
            Bill {bill_number}

        </motion.h3>

        <motion.p layout="position" className="date-intro"
                transition={{ duration: 0.3, ease: isExpanded ? 'linear' : 'linear' }}
>
            {intro_date}
        </motion.p>

        <button className="link"><a href={billNumberToLink(bill_number)}>Link</a></button>


      </motion.div>
      <motion.p layout="position" className="description"         
      transition={{ duration: 0.3, ease: isExpanded ? 'linear' : 'linear' }}
      >
        {isExpanded ? description : `${description.substring(0, 1000)}`}
      </motion.p>

      <motion.div
        className="content"
        initial={{ height: 0 }}
        animate={{ height: isExpanded ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: isExpanded ? 'linear' : 'linear' }}
        style={{ overflow: "hidden" }}
      >
        {isExpanded && (
          <>
        
            <motion.div className="sponsors">
              <h4>Chamber</h4>
              <p>{ChamberLetterToChamber(bill_type)}</p>
              
              <h4>Sponsors</h4>

              <ul>
                {sponsor_name}
                {/*{sponsor_name.map((sponsor, index) => (
                  <li key={index}>{sponsor}</li>
                ))}*/}
              </ul>
            </motion.div>

            <motion.div className="actions">
              <h4>Actions</h4>
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{last_recorded_action}</td>
                    <td>{last_recorded_action_date}</td>
                  </tr>
                </tbody>
                {/*<tbody>
                  {actions.map((action, index) => (
                    <tr key={index}>
                      <td>{action.body}</td>
                      <td>{action.date}</td>
                      <td>{action.action}</td>
                    </tr>
                  ))}
                </tbody>*/}
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
