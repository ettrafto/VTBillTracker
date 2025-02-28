import React from "react"

import './Title.css';


const Title = () => {


    return(  
        <>
        <div className='header-container'>
            <div className='title-container'>
                    <img src='/images/vermont-icon.png' alt='Vermont' className='vermont-icon'/>
                <h1 className='title'>VTBillChecker.org</h1>
            </div>

            <div className="sponsor-container">
                <img src='images/uvm-logo.png' alt='UVM' className='uvm-logo'/>
                <div className="uvm-sponsors">
                    <p>Community News Service</p>
                    <p>Center for Research on Vermont</p>
                    <p>Complex Systems</p>
                </div>
            </div>
            </div>
        </>
    )

};

export default Title;