import React, { useRef, FC, useState} from 'react';

import './App.css';

import { DefaultProvider, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString, PubKeyHash, hash160, buildPublicKeyHashScript, int2ByteString, reverseByteString } from "scrypt-ts";

import { GeneralTokenV3EcdsaOracleMin } from "./contracts/generaltokenV3ecdsaOracleMin";
import { dataFormatScryptSC, hexToLittleEndian, scriptUxtoSize, stringToHex,
  myUTXOs, setMyUTXOsData, myUTXOData, hexToBytes, utxoDataUpdata,} from "./myUtils";

import {homepvtKey, homenetwork} from './Page02Access';
import { broadcast, listUnspent, oracleWoC } from './mProviders';

const provider = new DefaultProvider({network: homenetwork});
let Alice: TestWallet

function PageSC07GPTokenCreate() {

  const [deployedtxid, setdeptxid] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  let txlink2 = ""
  const nTokens = useRef<any>(null);
  const value = useRef<any>(null);
  const idData = useRef<any>(null);
  const newAdd = useRef<any>(null);

  const satsBrinde = useRef<any>(null);

  const [binaryData2, setbinaryData2] = useState<Uint8Array>(new Uint8Array());

  const deploy = async (amount: any) => {

    if(homepvtKey.length != 64 || value.current.value < 1 || nTokens.current.value < 1)
    {
      alert('No PVT KEY or wrong data!!!')
    }
    else
    {
      setdeptxid("Wait!!!")

      //Para evitar o problema:  Should connect to a livenet provider
      //Bypassar o provider externo e const
      let provider = new DefaultProvider({network: homenetwork});

      //let privateKey = bsv.PrivateKey.fromHex(homepvtKey, bsv.Networks.testnet)
      let privateKey = bsv.PrivateKey.fromHex(homepvtKey, homenetwork)

      Alice = new TestWallet(privateKey, provider)

      try {

        const amount = value.current.value

        const signer = Alice
        //const message = toByteString('hello world', true)
        //Linha necessária nesta versão
        //O signee deve ser connectado
        await signer.connect(provider)

        let pubKey = bsv.PublicKey.fromPrivateKey(privateKey)

        //Description of the token
        //idData Deve ser enviado em HEX format, a menos que já esteja no formato Hex
        let description = dataFormatScryptSC(stringToHex(idData.current.value), '') 

        let toNewOwner = PubKeyHash(hash160(toHex(pubKey)))
        
        if(newAdd.current.value.length > 10)
        {
          if(newAdd.current.value.substring(0,1) === '1' 
          || newAdd.current.value.substring(0,1) === 'm'
          || newAdd.current.value.substring(0,1) === 'n')
            toNewOwner = PubKeyHash(toHex(bsv.Address.fromString(newAdd.current.value).hashBuffer))        
        }

//////////////////////////////////////////
//Jesus is the Lord
// Novo Deploy
//////////////////////////////////////////

        let changeAddExt: bsv.Address
        let changeADD = bsv.Address.fromPrivateKey(privateKey);

        changeAddExt = bsv.Address.fromPrivateKey(privateKey);

        let UTXOs1: bsv.Transaction.IUnspentOutput[] = []

        UTXOs1 = await listUnspent(changeADD, homenetwork)

        let UTXOs: bsv.Transaction.IUnspentOutput[] = []


        UTXOs.push(UTXOs1[0])

        for(let i = 0; i < UTXOs1.length; i++)
        {
          if(UTXOs1[i].satoshis > UTXOs[0].satoshis)
          {
            UTXOs[0] = UTXOs1[i] 
          }
        }

        let tx2 = new bsv.Transaction()
        let tSatoshis = 0

        /////////////////////////////////////////////////
        //A taxa vem somente da carteira
        /////////////////////////////////////////////////

        let genesisToken = ''

        for(let i = 0; i < UTXOs.length; i++)
        {
            tx2.from(UTXOs[i])
            tSatoshis = tSatoshis + UTXOs[i].satoshis

            genesisToken = genesisToken + reverseByteString(UTXOs[i].txId, 32n) 
            //+ reverseByteString(int2ByteString(BigInt(UTXOs[i].outputIndex), 4n), 4n)
            + int2ByteString(BigInt(UTXOs[i].outputIndex), 4n)
        }

        //criação do token unico do genesis
        //description = sha256(genesisToken) + description
        description = dataFormatScryptSC(stringToHex(idData.current.value), '')

        ///////////////////////
        //Oracle:
        ///////////////////////

        const witnessServer = 'https://oracle01.vercel.app'        
        const infoResponse = await oracleWoC(`${witnessServer}/infoECDSAmin`)

        let oraclePKEC = PubKey(toByteString(infoResponse[0].publicKey))

        ///////////////////////
        ///////////////////////

        console.log('ORACLE PK: ', toHex(oraclePKEC))

        //Se o PreVout = genesisToken não estiver correto, o token não será capaz de gerar um novo estado 
        //const instance = new GeneralTokenV2(toNewOwner, BigInt(nTokens.current.value), description, genesisToken)      
        const instance = new GeneralTokenV3EcdsaOracleMin(
          toNewOwner, BigInt(nTokens.current.value), description, //rbk, 
          oraclePKEC,
          )       
        await instance.connect(signer);

        tx2.addOutput(new bsv.Transaction.Output({
 
          script: instance.lockingScript,
          satoshis: amount,
        }))

        tSatoshis = tSatoshis - amount

        if(newAdd.current.value.length > 10)
        {
          if(newAdd.current.value.substring(0,1) === '1' 
          || newAdd.current.value.substring(0,1) === 'm'
          || newAdd.current.value.substring(0,1) === 'n')
            {

              let alertAmout = 1
              
              if(satsBrinde.current.value && satsBrinde.current.value > 1)
              {
                alertAmout = satsBrinde.current.value
              }
              
              tx2.addOutput(new bsv.Transaction.Output({
                script: bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(newAdd.current.value)),
                satoshis: alertAmout,
              }))

              tSatoshis = tSatoshis - alertAmout
            }
        }

        //TX do ADD
        tx2.addOutput(new bsv.Transaction.Output({
          //script: bsv.Script.buildPublicKeyHashOut(changeADD),
          script: bsv.Script.buildPublicKeyHashOut(changeAddExt),
          satoshis: tSatoshis,
        }))

        tx2 = tx2.seal()
        tx2 = tx2.sign(privateKey)

        // Para o Calcula da TAXA de rede

        let rawTX = toHex(tx2)
        let feeTX;
        if(rawTX.substring(82, 84) === '00')
        {
            console.log('\nAJUSTE DE TAXA DE REDE \n')
            //rawTX = rawTX.substring(0, 82) + tx2.DERSEC()[0] + rawTX.substring(84, rawTX.length)
            feeTX = Math.floor(((toHex(tx2).length/2) - ('00'.length/2) + (tx2.DERSEC()[0].length/2))*0.001) + 1
        } 
        else
        {
            feeTX = Math.floor((toHex(tx2).length/2)*0.001) + 1
        }
 
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////////////////////////

        tx2 = new bsv.Transaction()
  
        for(let i = 0; i < UTXOs.length; i++)
        {
            tx2.from(UTXOs[i])
        }

        tx2.addOutput(new bsv.Transaction.Output({
          script: instance.lockingScript,
          satoshis: amount,
        }))

        //tSatoshis = tSatoshis - amount

        if(newAdd.current.value.length > 10)
        {
          if(newAdd.current.value.substring(0,1) === '1' 
          || newAdd.current.value.substring(0,1) === 'm'
          || newAdd.current.value.substring(0,1) === 'n')
            {

              let alertAmout = 1
              
              if(satsBrinde.current.value && satsBrinde.current.value > 1)
              {
                alertAmout = satsBrinde.current.value
              }
              
              tx2.addOutput(new bsv.Transaction.Output({
                script: bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(newAdd.current.value)),
                satoshis: alertAmout,
              }))
              //tSatoshis = tSatoshis - 1
            }
        }

        //TX do ADD
        if((tSatoshis - feeTX) > 0)
        {
          tx2.addOutput(new bsv.Transaction.Output({
              //script: bsv.Script.buildPublicKeyHashOut(changeADD),
              script: bsv.Script.buildPublicKeyHashOut(changeAddExt),
              satoshis: tSatoshis - feeTX,
          }))
        }

        tx2 = tx2.seal().sign(privateKey)

        for(let i = 0; i < UTXOs.length + 1; i++)
        {
            console.log('DERSEC ', i, ': ',  tx2.DERSEC()[i])
        }
  
        rawTX = toHex(tx2)
    
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Jesus is the Lord
        /////////////////////////////////////////////////////////////////////////////////////////////////////////

        //Inserção da Assinatura do Script
        if(rawTX.substring(82, 84) === '00')
        {
            console.log('\nTest positon: ', rawTX.substring(82, 84))
            rawTX = rawTX.substring(0, 82) + tx2.DERSEC()[0] + rawTX.substring(84, rawTX.length)
        } 
        
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Jesus is the Lord
        /////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////
//Fim do novo Deploy
//////////////////////////////////////////

        let txId = await broadcast(rawTX, homenetwork)
        
        if(homenetwork === bsv.Networks.mainnet )
        {
          txlink2 = "https://whatsonchain.com/tx/" + txId;
        }
        else if (homenetwork === bsv.Networks.testnet )
        {
          txlink2 = "https://test.whatsonchain.com/tx/" + txId;
        }
        setLinkUrl(txlink2);
  
        setdeptxid(txId)

        if(txId.length === 64)
        {
          let myJsonStrUTXOs2 = utxoDataUpdata(rawTX, txId, null, 103)           
          setbinaryData2(hexToBytes(toByteString(myJsonStrUTXOs2, true)))
        }
       
      } catch (e) {
        console.error('deploy GPToken failes', e)
        alert('deploy GPToken failes')
      }
    }
  };


  return (
    <div className="App">

        <header className="App-header">
          

        <h2 style={{ fontSize: '34px', paddingBottom: '20px', paddingTop: '5px'}}>

          <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
          GPToken ECDSA-Soft Oracle - Deploy 
        
        </h2>

        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                  
                  <label style={{ fontSize: '14px', paddingBottom: '5px' }}
                    >Inform Tetherd Satoshis and Units of Token then Press Deploy:  
                  </label>     
        </div>

        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
                > 
                    <input ref={value} type="number" name="PVTKEY1" min="1" placeholder="satoshis (min 1 sat)" />
                </label>     
        </div>

        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
                > 
                    <input ref={nTokens} type="number" name="PVTKEY1" min="1" placeholder="units of token (min 1)" />
                </label>     
        </div>

        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
                > 
                    <input ref={idData} type="text" name="PVTKEY1" min="1" placeholder="description (optional)" />
                </label>     
        </div>

        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
                > 
                    <input ref={newAdd} type="text" name="PVTKEY1" min="1" placeholder="Add 2 Send (optional)" />
                </label>     
        </div>

        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
                > 
                    <input ref={satsBrinde} type="number" name="PVTKEY1" min="1" placeholder="Sats Tip (Optional)" />
                </label>     
        </div>


        <button className="insert" onClick={deploy}
                style={{ fontSize: '14px', paddingBottom: '2px', marginLeft: '5px'}}
        >Deploy</button>
                              
        {
          deployedtxid.length === 64?
          
         /* <button onClick={handleCopyClick}>Copy to ClipBoard</button> */

          <div>
          <div className="label-container" style={{ fontSize: '12px', paddingBottom: '0px', paddingTop: '20px' }}>
            <p className="responsive-label" style={{ fontSize: '12px' }}>TXID: {deployedtxid} </p>
          </div>
          <div className="label-container" style={{ fontSize: '12px', paddingBottom: '20px', paddingTop: '0px' }}>
            <p className="responsive-label" style={{ fontSize: '12px' }}>TX link: {' '} 
                <a href={linkUrl} target="_blank" style={{ fontSize: '12px', color: 'cyan'}}>
                {linkUrl}</a></p>
          </div>

        </div>
                    
          :

        <div className="label-container" style={{ fontSize: '12px', paddingBottom: '20px', paddingTop: '20px' }}>
          <p className="responsive-label" style={{ fontSize: '12px' }}>{deployedtxid} </p>
        </div>
          
      }

      </header>
    </div>
  );
}

export default PageSC07GPTokenCreate;
