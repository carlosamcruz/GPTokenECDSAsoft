// src/components/Home.tsx
import React, {FC} from 'react';
import { useState, useRef, useEffect } from "react";
import { DefaultProvider, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString, ByteString, hash256, hash160, buildPublicKeyHashScript, findSig, SignatureResponse, PubKeyHash, int2ByteString, MethodCallOptions, ContractTransaction, SmartContract, Sig, reverseByteString } from "scrypt-ts";
import './App.css';

import { broadcast, listUnspent, getTransaction, oracleWoC } from './mProviders';
import { GeneralTokenV3EcdsaOracleMin } from "./contracts/generaltokenV3ecdsaOracleMin";

import {homepvtKey, homenetwork, compState} from './Page02Access';

import { dataFormatScryptSC, convertBinaryToHexString, stringToHex, scriptUxtoSize, hexToLittleEndian, utxoDataUpdata, hexToBytes } from "./myUtils";

//const provider = new DefaultProvider({network: homenetwork});
let signer: TestWallet;

interface props1 {
  passedData: string;
}

const PageSC08GPTDataSet: FC<props1> = (props) => {

  //const [pubkey, setPubkey] = useState("");
  const [address, setaddress] = useState("");
  const [balance, setbalance] = useState(0);
  const labelRef = useRef<HTMLLabelElement | null>(null);
  const labelRef02 = useRef<HTMLLabelElement | null>(null);
  const labelRef03 = useRef<HTMLLabelElement | null>(null);

  //let txlink = useRef<HTMLLabelElement | null>(null);

  //const [linkUrl, setLinkUrl] = useState('https://whatsonchain.com/');
  const [linkUrl, setLinkUrl] = useState("");
  const [txid, setTXID] = useState("");
  const [fileName, setFileName] = useState("");
  
  const [waitAlert, setwaitAlert] = useState("Inform Text of File then Press Set Data");


  const [txb, settxb] = useState(true);


  const [binaryData2, setbinaryData2] = useState<Uint8Array>(new Uint8Array());
  //sCriptType deve ser ajustado para identificar cada tipo de script
  //preferencialmente no momento que o script for arquivado

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<Uint8Array | null>(null);
  const [hexStrFileData, setHexString] = useState('');
  const [sendButton, setsendButton] = useState(true);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {

    setwaitAlert("Press Set Data");
    settxb(true)

    const file = event.target.files && event.target.files[0];
    //setSelectedFile(file);

    if (file) {
      setSelectedFile(file);
      // Create a FileReader
      const reader = new FileReader();

      // Define a callback function for when the file is loaded
      reader.onload = (e) => {
        if(e.target)
        {
          const binaryString = e.target.result; // The file data as a binary string
          const hexString = convertBinaryToHexString(binaryString);

          //console.log("Data hexString: ", hexString)

          setHexString(hexString);
        }
      };

      // Read the file as an ArrayBuffer
      //reader.readAsArrayBuffer(file);
      reader.readAsBinaryString(file);
    }
  };

  let txtData = useRef<any>(null);
  let cStateTxid = useRef<any>(null);
  let txlink2 = ""
  const tokenIndex = useRef<any>(null);

  const setBalance = async (amount: any) => {

    //homepvtKey = localPvtKey.current.value;

    console.log("setBalance!!!")

    if(homepvtKey.length !== 64)
    {
      alert("Wrong PVT Key");
      setaddress("");
      setbalance(0);
    }
    else
    {
      setaddress("Wait!!!");

      //bsv.PrivateKey.fromHex
      let privateKey = bsv.PrivateKey.fromHex(homepvtKey, homenetwork);
      //let privateKey = bsv.PrivateKey.fromHexAddComp(homepvtKey, homenetwork, compState);
      privateKey.compAdd(compState);

      privateKey = bsv.PrivateKey.fromHex(homepvtKey, homenetwork);
      //privateKey.fromHexAddComp(homepvtKey, homenetwork, compState);
  
      //Para evitar o problema:  Should connect to a livenet provider
      //Bypassar o provider externo e const
      let provider = new DefaultProvider({network: homenetwork});

      signer = new TestWallet(privateKey, provider)

      //Linha necessária nesta versão
      //O signee deve ser connectado
      await signer.connect(provider)

      //console.log("PVT KEY: ", privateKey.compressed)

      try {

        const UTXOs = await listUnspent(bsv.Address.fromPrivateKey(privateKey).toString(), homenetwork)
        //console.log('Depois de unspent call', UTXOs.length)

        let balance = 0
        for(let i = 0; i < UTXOs.length; i++ )
        {
          balance = balance + UTXOs[i].satoshis
        }
        setbalance(balance)

        setaddress(bsv.Address.fromPrivateKey(privateKey).toString()) 

      } catch (e) {
        console.error('Failed', e)
        alert('Failed')
      }
    }
  };

  let cont = 0

  //Apresentar o Balance do Endereço
  useEffect(() => {
    console.log("Call useEffect")
    if(cont === 0)
    {    setBalance(0);
    }
    cont++
  }, []);  

  const handleSendButton = () => {
    if (sendButton) {
      setsendButton(false)
      writeToChain(0)
    }
  };

  const writeToChain = async (amount: any) => {

    //homepvtKey = localPvtKey.current.value;

    if(homepvtKey.length !== 64)
    {
      alert("Wrong PVT Key");
      setaddress("");
      setbalance(0);
      settxb(false);
      setLinkUrl("");
      setTXID("")
      setsendButton(true)
    }
    
    else if((txtData.current.value === "" && hexStrFileData === "" ) || cStateTxid.current.value.length !== 64)
    {
      alert("Missing Data");
      setsendButton(true)
      setwaitAlert("Inform Text of File then Press Set Data")
    }
    
    else
    {
      setLinkUrl('');
      setTXID('')
      setwaitAlert("Wait!!!");

      console.log('Current State: ', cStateTxid.current.value)

      //////////////////////////////////////////////////////////
      //Data Input
      //////////////////////////////////////////////////////////
      let dataToChain: ByteString = '00'

      let newData = dataToChain;

      newData = hexStrFileData;
      if(hexStrFileData === "")
      {
        newData = stringToHex(txtData.current.value);
      }

      let fileName2 = ''
      if(selectedFile !== null)
      {
        fileName2 = selectedFile.name
      }

      newData = dataFormatScryptSC(newData, fileName2)

      ////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////

      //newData = newData + newDataInfo

      console.log("Data Size: ", newData.length)
      console.log("Data: ", newData)

      let posNew1 = 0 // Output Index of the Contract in the Current State TX

      if(tokenIndex.current.value === '1' )
      {
        posNew1 = 1
      }

      let privateKey = bsv.PrivateKey.fromHex(homepvtKey, homenetwork);
      privateKey.compAdd(compState);

      privateKey = bsv.PrivateKey.fromHex(homepvtKey, homenetwork);
  
      let provider = new DefaultProvider({network: homenetwork});

      await provider.connect()

      signer = new TestWallet(privateKey, provider)

      //Linha necessária nesta versão
      //O signee deve ser connectado
      await signer.connect(provider)

      let tx3 = new bsv.Transaction
      
      tx3 = new bsv.Transaction (await getTransaction(cStateTxid.current.value, homenetwork))

      //let thisTxId = cStateTxid.current.value

      let finish = false

      console.log('TXID Current State: ', tx3.id)

      //let instance2 = GeneralToken.fromTx(tx3, posNew1)
      let instance2 = GeneralTokenV3EcdsaOracleMin.fromTx(tx3, posNew1)
      //Inform to the system the right output index of the contract and its sequence
      tx3.pvTxIdx(tx3.id, posNew1, sha256(tx3.outputs[posNew1].script.toHex()))
  
      let pbkey = bsv.PublicKey.fromPrivateKey(privateKey)
      let pvtkey = privateKey;
      
      //https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#method-with-signatures
  
      const balance = instance2.balance
      const nextInstance = instance2.next()
      //finish = true
  
      if(!finish)
      {
          nextInstance.data = newData;
      }

      //let toNewOwner = PubKeyHash(toHex(bsv.Address.fromString(receiverPBK.current.value).hashBuffer))
             
      await instance2.connect(signer)

      //Esta amarrado a instancia Pai.
      instance2.bindTxBuilder(
        'setupToken',         
        (
          current: GeneralTokenV3EcdsaOracleMin,
          options: MethodCallOptions<GeneralTokenV3EcdsaOracleMin>,
          ...args: any
        ): Promise<ContractTransaction> => 
      {
        const changeAddress = bsv.Address.fromPrivateKey(pvtkey)
  
        const unsignedTx: bsv.Transaction = new bsv.Transaction()
        .addInputFromPrevTx(tx3, posNew1)

        if (finish) 
        {         
          unsignedTx.addOutput(new bsv.Transaction.Output({
            //script: buildPublicKeyHashScript(hash160(instance2.alice)),
            script: buildPublicKeyHashScript(instance2.alice),
            satoshis: balance
          }))
          .change(changeAddress)
        }
        else
        {

          /////////////////////////////////////////////////////////
          //Jesus is the Lord!!!
          //
          // solução para quebrar UTXO replicado
          /////////////////////////////////////////////////////////
          if(instance2.genesisTX === '')
          {
            nextInstance.genesisTX = tx3.id + instance2.tokenType
          }

          console.log('nextInstance.genesisTX: ', nextInstance.genesisTX)
          //console.log('nextInstance.prevUtxo: ', nextInstance.prevUtxo)
          /////////////////////////////////////////////////////////
          /////////////////////////////////////////////////////////

          unsignedTx.addOutput(new bsv.Transaction.Output({
            script: nextInstance.lockingScript,
            satoshis: balance,
          }))
          .change(changeAddress)
        }            

        //console.log('Unsig TX Out: ', toHex(unsignedTx.outputs[0].script))
        return Promise.resolve({
            tx: unsignedTx,
            atInputIndex: 0,
            nexts: [
            ]
        });              
      });

      console.log("Alice PKHASH: ", instance2.alice)
      console.log("Alice PK: ", toHex(pbkey))

      let txid01 = cStateTxid.current.value
      let index01 = posNew1
      let networkOc = 'test'

      if(homenetwork !== bsv.Networks.testnet)
      {
        networkOc = 'main'
      }

      /////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////      

      console.log("*******************Até aqui. ")

      //Dummy Sig for FEE Calculations
      let sigOracle = toByteString('3047022300000026ecfbba3be4b8727e5eb7cfda955907bfe9788c5453847da76d84d6b41d50ae022071a713ba84465a30aaa51b2e0f2880b9f38d46e158fd6ef472f0c33fd57275e741')

      console.log('Pub Key: ', toHex(pbkey))

      const partialTx = await instance2.methods.setupToken(//rSig, 
        sigOracle, //PubKey(toHex(pubKeyP2)),
        (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey)),
        finish,
        newData,// utxo2Fee,      
        { multiContractCall: true, } as MethodCallOptions<GeneralTokenV3EcdsaOracleMin>
      )

      let primgHash =  ''

      //////////////////////////////////////////////////////////////////
      //  Contexto Dummy
      //    Para Criar a Preimage
      //////////////////////////////////////////////////////////////////
      SmartContract.dummyFlagOff() //Erros nos tests mostraram necessário
      { //const { tx: callTx, nexts } = await SmartContract.multiContractCall(
        const { tx: callTxDummy, nexts } = await SmartContract.multiContractCallDummy(
          partialTx,
          signer,
        )

        //Se não fizer o broadcast 

        primgHash =  (hash256(toHex(callTxDummy.inputs[0].getPreimage(callTxDummy,0))))

      }

      const witnessServer = 'https://oracle01.vercel.app/v1'

      const responseECDSA = await oracleWoC(`${witnessServer}/certifyECDSAmin/${txid01}/${index01}/${primgHash}/${networkOc}`)
      
      console.log('Response Oracle: ', (responseECDSA[0].sigDER))

      //Assinatura do Oraculo

      sigOracle = toByteString(responseECDSA[0].sigDER)

      const partialTx2 = await instance2.methods.setupToken(//rSig, 
        sigOracle, //PubKey(toHex(pubKeyP2)),
        (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey)),
        finish,
        newData, //utxo2Fee,      
        { multiContractCall: true, } as MethodCallOptions<GeneralTokenV3EcdsaOracleMin>
      )
      
      ////////////////////////////////////////
      //Jesus is the Lord
      //Versão para Oraculo ECDSA
      ////////////////////////////////////////      
      const txRsult = await SmartContract.multiContractCallV2(  
        partialTx2,
        signer,
      )    
      //SmartContract.dummyFlagOff()
      let callTx = new bsv.Transaction(txRsult)

//////////////////////////////////////////////////////////////

      settxb(true);

      console.log('\nTX Flag 52: ', toHex(callTx))

      const txId = callTx.id

      console.log('\nTXID Length: ', txId.length)

      if(txId.length === 64)
      {
        console.log('\nTXID: ', txId)
 
        if(homenetwork === bsv.Networks.mainnet )
        {
          txlink2 = "https://whatsonchain.com/tx/" + txId;
        }
        else if (homenetwork === bsv.Networks.testnet )
        {
          txlink2 = "https://test.whatsonchain.com/tx/" + txId;
        }

        if(callTx.id.length === 64)
        {
          let finalUTXOs = await listUnspent(bsv.Address.fromPrivateKey(privateKey), homenetwork)
          let myJsonStrUTXOs2 = utxoDataUpdata(toHex(callTx), callTx.id, finalUTXOs, 103) 
          
          setbinaryData2(hexToBytes(toByteString(myJsonStrUTXOs2, true)))
        }

        setwaitAlert('');

        //setbalance02(0)
        setLinkUrl(txlink2);

        setTXID(txId)

        setBalance(0)
        
        setHexString('')

        setSelectedFile(null);

      }
      else      
      {
        setwaitAlert('');
        setHexString('')
        setLinkUrl('');
        setTXID('')
        alert("Fail to Broadcast!!!");
      }
      setsendButton(true)

    }

  };

  const labelStyle = {
    backgroundColor: 'black',
    color: 'white',
    padding: '5px 5px',
    cursor: 'pointer',
    borderRadius: '5px',
    fontSize: '14px', 
    paddingBottom: '5px'
  };

  return (

    <div className="App-header">
      <h2 style={{ fontSize: '34px', paddingBottom: '0px', paddingTop: '0px'}}>

        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>

        GPToken ECDSA-Soft Oracle - Set Data
        {
         /*
        Create {props.passedData} Token
        */
        }
        
      </h2>

      <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                          <label htmlFor="output1"  style={{ fontSize: '12px', paddingBottom: '5px' }}                           
                          >
                              {'Address: '} 
                          </label>
                          <output id="output1"></output>

                          <label ref={labelRef02} style={{ fontSize: '12px', paddingBottom: '5px' }} 
                          >
                            {address}

                          </label>                   
        </div>

        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                          <label htmlFor="output1"  style={{ fontSize: '12px', paddingBottom: '5px' }}                           
                          >
                              {'Balance: '} 
                          </label>
                          <output id="output1"></output>

                          <label ref={labelRef03} style={{ fontSize: '12px', paddingBottom: '5px' }} 
                          >
                            {balance} satoshis

                          </label>                   
      </div>



      <div>
        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
          <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
              > 
                 {/* <input ref={localPvtKey} type="hex" name="PVTKEY1" min="1" defaultValue={'PVT KEY'} placeholder="hex" />*/}
                 <input ref={cStateTxid} type="hex" name="PVTKEY1" min="1" placeholder="current state txid" />
              </label>     
          </div>
      </div>

      <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={tokenIndex} type="number" name="PVTKEY1" min="1" placeholder="0 or 1 (0 default)" />
                </label>     
      </div>

      <div>
        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
          <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
              > 
                 {/* <input ref={localPvtKey} type="hex" name="PVTKEY1" min="1" defaultValue={'PVT KEY'} placeholder="hex" />*/}
                 <input ref={txtData} type="text" name="PVTKEY1" min="1" placeholder="text (or file)" />
              </label>     
          </div>
      </div>

      <div>
        <div style={{ display: 'inline-block', textAlign: 'center', justifyContent: 'right', paddingBottom: '20px'}}>
            <label  style={labelStyle}>
              Select File
              <input type="file" onChange={handleFileChange} />
            </label>
        </div>
      </div>
      <div>
        <div >
          
            {selectedFile && (
                    <div style={{ display: 'inline-block', textAlign: 'center', justifyContent: 'right', paddingBottom: '20px'}}>
                        <p style={{ fontSize: '12px', paddingBottom: '0px' }} >
                          {selectedFile.name}</p>
                    </div>
            )}
        </div>
      </div>

      <div>
        {
          sendButton?
          <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
              
              <button className="insert" onClick={handleSendButton}
                  style={{ fontSize: '14px', paddingBottom: '0px', marginLeft: '0px'}}
              >Set Data</button>

          </div>
          :
          <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
              
          <button className="insert" onClick={handleSendButton}
              style={{ fontSize: '14px', paddingBottom: '0px', marginLeft: '0px'}}
          >Set Data</button>
          </div>
        }
      </div>

      {
          txb?
          waitAlert ===''?
              <div>
                <div className="label-container" style={{ fontSize: '12px', paddingBottom: '20px', paddingTop: '0px' }}>
                  <p className="responsive-label" style={{ fontSize: '12px' }}>TXID: {txid} </p>
                </div>
                <div className="label-container" style={{ fontSize: '12px', paddingBottom: '20px', paddingTop: '0px' }}>
                  <p className="responsive-label" style={{ fontSize: '12px' }}>TX link: {' '} 
                      <a href={linkUrl} target="_blank" style={{ fontSize: '12px', color: 'cyan'}}>
                      {linkUrl}</a></p>
                </div>

              </div>
              :
              <div className="label-container" style={{ fontSize: '12px', paddingBottom: '20px', paddingTop: '0px' }}>
              <p className="responsive-label" style={{ fontSize: '12px' }}>{waitAlert} </p>
              </div>  
          :
          ""
      }           
    </div>
  );
};

export default PageSC08GPTDataSet;