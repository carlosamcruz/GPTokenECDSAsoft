import React, { useRef, FC, useState} from 'react';

import './App.css';

import { DefaultProvider, MethodCallOptions, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString, hash160, buildPublicKeyHashScript, findSig, SignatureResponse, PubKeyHash, reverseByteString, int2ByteString, ContractTransaction, SmartContract, hash256 } from "scrypt-ts";

import { GeneralTokenV3EcdsaOracleMin } from "./contracts/generaltokenV3ecdsaOracleMin";

import {homepvtKey, homenetwork, compState} from './Page02Access';
import { getSpentOutput} from './mProviders';
import { sleep, scriptUxtoSize, hexToLittleEndian } from "./myUtils";

const provider = new DefaultProvider({network: homenetwork});
let Alice: TestWallet

let txlink2 = ""

function PageSC14GPTokenMelt() {

  const [deployedtxid, setdeptxid] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const txid = useRef<any>(null);
  const txidPrvStt = useRef<any>(null);
  const tokenIndex = useRef<any>(null);

  const interact = async (amount: any) => {
    setdeptxid("Wait!!!")

    if(txid.current.value.length === 64 || txidPrvStt.current.value.length === 64)
    {

      //Para evitar o problema:  Should connect to a livenet provider
      //Bypassar o provider externo e const
      let provider = new DefaultProvider({network: homenetwork});
      let posNew1 = 0 // Output Index of the Contract in the Current State TX

      if(tokenIndex.current.value === '1' )
      {
        posNew1 = 1
      }

      let privateKey = bsv.PrivateKey.fromHex(homepvtKey, homenetwork) 
      privateKey.compAdd(compState);

      privateKey = bsv.PrivateKey.fromHex(homepvtKey, homenetwork)

      Alice = new TestWallet(privateKey, provider)
  
      try {
  
        const signer = Alice
    
        //Linha necessária nesta versão
        //O signee deve ser connectado
        await signer.connect(provider)
        
        let tx = new bsv.Transaction

        //////////////////////////////////////////////////////
        //Jesus is the Lord
        //////////////////////////////////////////////////////
          
        if(txid.current.value.length === 64)
        {
            tx = await provider.getTransaction(txid.current.value)
        }
        else if(txidPrvStt.current.value.length === 64)
        {
            let currentStateTXID = txidPrvStt.current.value
            let stxos = await getSpentOutput(currentStateTXID, 0, homenetwork)
      
            while(stxos[0].inputIndex !== -1)
            {
              currentStateTXID = stxos[0].txId;
      
              await sleep(500);
              stxos = await getSpentOutput(currentStateTXID, 0, homenetwork)
              console.log("Input:", stxos[0].inputIndex)
            }
      
            tx = await provider.getTransaction(currentStateTXID)    
        }
    
        //////////////////////////////////////////////////////
        //////////////////////////////////////////////////////
  
        console.log('Current State TXID: ', tx.id)
  
        let finish = true
        let newData = '';

        let instance2 = GeneralTokenV3EcdsaOracleMin.fromTx(tx, posNew1)
        //Inform to the system the right output index of the contract and its sequence
        tx.pvTxIdx(tx.id, posNew1, sha256(tx.outputs[posNew1].script.toHex()))
    
        let pbkey = bsv.PublicKey.fromPrivateKey(privateKey)

        const balance = instance2.balance
        const nextInstance = instance2.next()
    
        await instance2.connect(signer)   

        instance2.bindTxBuilder(
          'setupToken',         
          (
            current: GeneralTokenV3EcdsaOracleMin,
            options: MethodCallOptions<GeneralTokenV3EcdsaOracleMin>,
            ...args: any
          ): Promise<ContractTransaction> => 
        {
          const changeAddress = bsv.Address.fromPrivateKey(privateKey)
    
          const unsignedTx: bsv.Transaction = new bsv.Transaction()
          .addInputFromPrevTx(tx, posNew1)
  
          if (finish) 
          {         
            unsignedTx.addOutput(new bsv.Transaction.Output({
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
              nextInstance.genesisTX = tx.id + instance2.tokenType
            }
  
            console.log('nextInstance.genesisTX: ', nextInstance.genesisTX)
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
  
        let networkOc = 'test'
  
        if(homenetwork !== bsv.Networks.testnet)
        {
          networkOc = 'main'
        }
  
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////      
  
        //Para finalizar o contrato, não precisa da assinatura do oraculo
        let sigOracle = toByteString('00')
   
        //Para finalizar o contrato, não precisa da assinatura do oraculo
        const partialTx = await instance2.methods.setupToken(
          sigOracle,
          (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey)),
          finish,
          newData, //utxo2Fee,      
          { multiContractCall: true, } as MethodCallOptions<GeneralTokenV3EcdsaOracleMin>
        )

        //Para finalizar o contrato, não precisa da assinatura do oraculo

        SmartContract.dummyFlagOff() //Erros nos tests mostraram necessário

        ////////////////////////////////////////
        //Jesus is the Lord
        //Versão para Oraculo ECDSA
        ////////////////////////////////////////
        const txRsult = await SmartContract.multiContractCallV2(  
          partialTx,
          signer,
        )    
        //SmartContract.dummyFlagOff()
        let callTx = new bsv.Transaction(txRsult)
  
        console.log( 'TXID: ', callTx.id)
               
        if(homenetwork === bsv.Networks.mainnet )
        {
          txlink2 = "https://whatsonchain.com/tx/" + callTx.id;
        }
        else if (homenetwork === bsv.Networks.testnet )
        {
          txlink2 = "https://test.whatsonchain.com/tx/" + callTx.id;
        }
        setLinkUrl(txlink2);
  
        setdeptxid(callTx.id)
    
      } catch (e) {

        console.error('Finish fails', e)
        alert('Finish fails')
        setdeptxid("")
      }
    }
    else
    {
      alert('Wrong TXID Format!!!')
      setdeptxid("Try Again!!!")
    }
  };

  return (
    <div className="App">
        <header className="App-header">

        <h2 style={{ fontSize: '34px', paddingBottom: '5px', paddingTop: '5px'}}>

          <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>   
          GPToken ECDSA-Soft Oracle - Extinguish
          
        </h2>
       
        <div>

          <div style={{ textAlign: 'center' , paddingBottom: '20px' }}>
                
                <label style={{ fontSize: '14px', paddingBottom: '2px' }}
                  >Inform Current or Previous State TXID:  
                </label>     
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={txid} type="hex" name="PVTKEY1" min="1" placeholder="current state" />
                </label>     
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={txidPrvStt} type="hex" name="PVTKEY1" min="1" placeholder="pevious state (optional)" />
                </label>     
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={tokenIndex} type="number" name="PVTKEY1" min="1" placeholder="0 or 1 (0 default)" />
                </label>     
          </div>

          <div style={{ textAlign: 'center' }}>     
                <button className="insert" onClick={interact}
                    style={{ fontSize: '14px', paddingBottom: '2px', marginLeft: '0px'}}
                >Extinguish</button>
          </div>

        </div>

        {
          deployedtxid.length === 64?
          
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

export default PageSC14GPTokenMelt;
