import React from "react";

import './Footer.css';

const Footer = () => {
    return(
        <div className="footer-container">
            <div className="footer-name">
            Made by Evan Trafton
            </div>
            <div className="footer-link">
                <button><a href="https://www.evantrafton.com" target="_blank" rel="noopener noreferrer">evantrafton.com</a></button>
            </div>
        </div>
    )
}

export default Footer;