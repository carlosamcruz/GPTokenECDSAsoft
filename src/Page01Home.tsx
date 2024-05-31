// src/components/Home.tsx
import React, {FC} from 'react';
import { useState, useRef, useEffect } from "react";
import { DefaultProvider, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString } from "scrypt-ts";
import './App.css';

export let homepvtKey: string = "";
export let homenetwork = bsv.Networks.testnet;
export let compState = true;


const PageHome: FC = () => {

  const texts = [
    'Home/Access:', 'Password or Private Key',
    'Home/Access:', 'Browser Wallet',
    'Smart Contracts:', 'Build Yours!!!'  
  ];

  const [textIndex, setTextIndex] = useState(0);
  const [labelText, setLabelText] = useState(texts[0]);
  const [labelText2, setLabelText2] = useState(texts[1]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      //const newIndex = (textIndex + 1) % texts.length;
      const newIndex = ((textIndex + 2)) % (texts.length);
      setLabelText(texts[newIndex]);
      setLabelText2(texts[newIndex + 1]);
      setTextIndex(newIndex);
    }, 4000); // Change text every 4 seconds

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [textIndex]);


  return (

    <div >
      <div className="App-header2">
        <h2 style={{ fontSize: '30px', paddingBottom: '5px', paddingTop: '5px'}}>

          <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
          
          GPToken with Oracle & Soft ECDSA  
          
        </h2>
      </div>


      <div className="body2">

        {//<h1>Embedded External Website</h1>
        }

        <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                
                <label style={{ fontSize: '20px', paddingBottom: '2px' }}
                  >Enjoy Navegating  
                </label>     
        </div>

        <iframe
          title="External Website"
          src="https://makc.github.io/misc/relativity-1.html" // Replace with the URL of the website you want to display
          width="100%"
          height="200px" // Set the height as needed
          
          allowFullScreen
        ></iframe>

        <div>

          <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
                
                <label style={{ fontSize: '14px', paddingBottom: '2px' }}
                  > 
                  {labelText}  
                </label>     

          </div>

          <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '40px' }}>
                
                <label style={{ fontSize: '14px', paddingBottom: '2px' }}
                  > 
                  {labelText2}  
                </label>     
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHome;