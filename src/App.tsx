import React, { useRef, FC, useState } from 'react';
//import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import './App.css';

import Page01Home from './Page01Home';
import Page02Access from './Page02Access';

import Page03Read from './Page03Read';

import PageSC07GPTokenCreateECDSAmin from "./PageSC07GPTokenCreateECDSAmin"
import PageSC08GPTDataSetECDSAmin from "./PageSC08GPTDataSetECDSAmin"
import PageSC09GPTokenSplitECDSAmin from "./PageSC09GPTokenSplitECDSAmin"
import PageSC10GPTokenMergeECDSAmin from "./PageSC10GPTokenMergeECDSAmin"
import PageSC11GPTokenOrdLockECDSAmin from "./PageSC11GPTokenOrdLockECDSAmin"
import PageSC12GPTokenCancelOrdECDSAmin from "./PageSC12GPTokenCancelOrdECDSAmin"
import PageSC13GPTokenBuyECDSAmin from "./PageSC13GPTokenBuyECDSAmin"
import PageSC14GPTokenMeltECDSAmin from "./PageSC14GPTokenMeltECDSAmin"

function App() {

  const [currentPage, setCurrentPage] = useState<string>('Page01Home');
  const [showHomeDropdown, setShowHomeDropdown] = useState<boolean>(false);
  const [showSCDropdown, setShowSCDropdown] = useState<boolean>(false);
  const [showGPTokenDropdown, setShowGPTokenDropdown] = useState<boolean>(false);


  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setShowHomeDropdown(false);
    setShowSCDropdown(false);

    setShowGPTokenDropdown(false);
  };

  return (

        <div className="App">

            <nav className="navbar">
              <div className="dropdown">
                <button className="button" 
                    onClick={() => {setShowHomeDropdown(!showHomeDropdown);
                                    setShowSCDropdown(false); setShowGPTokenDropdown(false)}}>
                  Home
                </button>
                {showHomeDropdown && (
                  <div className="dropdown-content">

                    <button className="dropdown-button" onClick={() => handlePageChange('Page02Access')}>
                      Access
                    </button>

                    <button className="dropdown-button" onClick={() => handlePageChange('Page01Home')}>
                      Reception
                    </button>

                  </div>
                )}
              </div>

              <div className="dropdown">
                <button className="button" 
                    onClick={() => {setShowSCDropdown(!showSCDropdown); setShowHomeDropdown(false); 
                                   }}>
                  Smart Contracts
                </button>
                {showSCDropdown && (
                  <div className="dropdown-content">

                    <button className="dropdown-button" 
                          onClick={() => {setShowGPTokenDropdown(!showGPTokenDropdown)}}>
                        GPToken
                    </button>
                    {showGPTokenDropdown && (
                        <div className="button">
                          <button className="dropdown-button-right" style={{ border: '1px solid #fff', marginLeft: 'auto',  marginRight: '0', 
                          fontSize: '12px',color: 'white', background: '#323a3c', width: '50%'}} onClick={() => handlePageChange('GPToken01')}>
                            Deploy
                          </button>
                          <button className="dropdown-button-right" style={{ border: '1px solid #fff', marginLeft: 'auto',  marginRight: '0', 
                          fontSize: '12px',color: 'white', background: '#323a3c', width: '50%'}} onClick={() => handlePageChange('GPToken02')}>
                            Set Data
                          </button>    
                          <button className="dropdown-button-right" style={{ border: '1px solid #fff', marginLeft: 'auto',  marginRight: '0', 
                          fontSize: '12px',color: 'white', background: '#323a3c', width: '50%'}} onClick={() => handlePageChange('GPToken03')}>
                            Transfer
                          </button>    
                          <button className="dropdown-button-right" style={{ border: '1px solid #fff', marginLeft: 'auto',  marginRight: '0', 
                          fontSize: '12px',color: 'white', background: '#323a3c', width: '50%'}} onClick={() => handlePageChange('GPToken04')}>
                            Split
                          </button>     
                          <button className="dropdown-button-right" style={{ border: '1px solid #fff', marginLeft: 'auto',  marginRight: '0', 
                          fontSize: '12px',color: 'white', background: '#323a3c', width: '50%'}} onClick={() => handlePageChange('GPToken05')}>
                            Merge
                          </button>    
                          <button className="dropdown-button-right" style={{ border: '1px solid #fff', marginLeft: 'auto',  marginRight: '0', 
                          fontSize: '12px',color: 'white', background: '#323a3c', width: '50%'}} onClick={() => handlePageChange('GPToken06')}>
                            Order Lock
                          </button>    
                          <button className="dropdown-button-right" style={{ border: '1px solid #fff', marginLeft: 'auto',  marginRight: '0', 
                          fontSize: '12px',color: 'white', background: '#323a3c', width: '50%'}} onClick={() => handlePageChange('GPToken07')}>
                            Order Cancel
                          </button>    
                          <button className="dropdown-button-right" style={{ border: '1px solid #fff', marginLeft: 'auto',  marginRight: '0', 
                          fontSize: '12px',color: 'white', background: '#323a3c', width: '50%'}} onClick={() => handlePageChange('GPToken08')}>
                            Order Buy
                          </button>    
                          <button className="dropdown-button-right" style={{ border: '1px solid #fff', marginLeft: 'auto', marginRight: '0', 
                          fontSize: '12px',color: 'white', background: '#323a3c', width: '50%'}} onClick={() => handlePageChange('GPToken09')}>
                            Details
                          </button>    
                          <button className="dropdown-button-right" style={{ border: '1px solid #fff', marginLeft: 'auto', marginRight: '0', 
                          fontSize: '12px',color: 'white', background: '#323a3c', width: '50%'}} onClick={() => handlePageChange('GPToken10')}>
                            Extinguish
                          </button>                     
                        </div>
                    )}

                  </div>
                )}  
              </div>
            </nav>

            {currentPage === 'Page01Home' && <Page01Home />}
            {currentPage === 'Page02Access' && <Page02Access passedData={''}/>}            

            {currentPage === 'GPToken01' && <PageSC07GPTokenCreateECDSAmin />}
            {currentPage === 'GPToken02' && <PageSC08GPTDataSetECDSAmin  passedData={'GPT'}/>}
            {currentPage === 'GPToken03' && <PageSC09GPTokenSplitECDSAmin passedData={'Transfer'}/>}
            {currentPage === 'GPToken04' && <PageSC09GPTokenSplitECDSAmin passedData={'Split'}/>}
            {currentPage === 'GPToken05' && <PageSC10GPTokenMergeECDSAmin/>}
            {currentPage === 'GPToken06' && <PageSC11GPTokenOrdLockECDSAmin/>}
            {currentPage === 'GPToken07' && <PageSC12GPTokenCancelOrdECDSAmin/>}
            {currentPage === 'GPToken08' && <PageSC13GPTokenBuyECDSAmin/>}
            {currentPage === 'GPToken09' && <Page03Read passedData={'GPToken'}/>}
            {currentPage === 'GPToken10' && <PageSC14GPTokenMeltECDSAmin/>}


        </div>
  );
}

export default App;
