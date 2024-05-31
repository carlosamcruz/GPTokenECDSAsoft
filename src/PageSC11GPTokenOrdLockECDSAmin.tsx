import React, { useRef, FC, useState} from 'react';

import './App.css';

import { DefaultProvider, MethodCallOptions, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString, hash160, buildPublicKeyHashScript, findSig, SignatureResponse, PubKeyHash, reverseByteString, int2ByteString, SmartContract, hash256 } from "scrypt-ts";

import { GeneralTokenV3EcdsaOracleMin } from "./contracts/generaltokenV3ecdsaOracleMin";

import {homepvtKey, homenetwork, compState} from './Page02Access';
import { getSpentOutput, oracleWoC} from './mProviders';
import { sleep } from "./myUtils";

//const provider = new DefaultProvider({network: bsv.Networks.testnet});
const provider = new DefaultProvider({network: homenetwork});
let Alice: TestWallet

let txlink2 = ""

function PageSC11GPTokenOrdLock() {

  const [deployedtxid, setdeptxid] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const txid = useRef<any>(null);
  const txidPrvStt = useRef<any>(null);
  const tokenIndex = useRef<any>(null);
  const orderValue = useRef<any>(null);
  const receiverPBK = useRef<any>(null);

  const interact = async (amount: any) => {
    setdeptxid("Wait!!!")

    if((txid.current.value.length === 64 || txidPrvStt.current.value.length === 64) 
      && (parseInt(orderValue.current.value, 10) > 0)
      )
    {

      let posNew1 = 0 // Output Index of the Contract in the Current State TX

      if(tokenIndex.current.value === '1' )
      {
        posNew1 = 1
      }

      //Para evitar o problema:  Should connect to a livenet provider
      //Bypassar o provider externo e const
      let provider = new DefaultProvider({network: homenetwork});

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
              //console.log("TX Output ", i, " spent on:", stxos[0].txId)
              console.log("Input:", stxos[0].inputIndex)
            }
      
            tx = await provider.getTransaction(currentStateTXID)
      
        }
        //////////////////////////////////////////////////////
        //////////////////////////////////////////////////////
  
        console.log('Current State TXID: ', tx.id)
  
        let instance2 = GeneralTokenV3EcdsaOracleMin.fromTx(tx, posNew1)
        //Inform to the system the right output index of the contract and its sequence
        tx.pvTxIdx(tx.id, posNew1, sha256(tx.outputs[posNew1].script.toHex()))

        let orderCancel = false
    
        let pbkey = bsv.PublicKey.fromPrivateKey(privateKey)

        const balance = instance2.balance
        const nextInstance = instance2.next()

        let pbkeyUserX = PubKeyHash(toHex(bsv.Address.fromPrivateKey(privateKey, homenetwork).hashBuffer))

        if((receiverPBK.current.value).length > 10  )
        {
          pbkeyUserX = PubKeyHash(toHex(bsv.Address.fromString(receiverPBK.current.value).hashBuffer))
        }
        else
        {
          pbkeyUserX = instance2.alice
        }

        if(!orderCancel)
        {
            nextInstance.sell = true
            nextInstance.toBuyer = pbkeyUserX           
            nextInstance.price = BigInt(parseInt(orderValue.current.value, 10))
        }
        else
        {
            nextInstance.toBuyer = instance2.alice
            nextInstance.sell = false
            nextInstance.price = 0n
        }
        
        await instance2.connect(signer)

        instance2.bindTxBuilder('sellOrder', async function () {

          const changeAddress = bsv.Address.fromPrivateKey(privateKey)
     
          const unsignedTx: bsv.Transaction = new bsv.Transaction()
          .addInputFromPrevTx(tx, 0)

          /////////////////////////////////////////////////////////
          //Jesus is the Lord!!!
          //
          // solução para quebrar UTXO replicado
          /////////////////////////////////////////////////////////
          if(instance2.genesisTX === '')
          {
            nextInstance.genesisTX = tx.id + instance2.tokenType
            console.log('this.genesisTX Ext: ', nextInstance.genesisTX )
          }

          if(nextInstance.toBuyer !== instance2.alice)
          {
              unsignedTx.addOutput(new bsv.Transaction.Output({
                script: nextInstance.lockingScript,
                satoshis: balance,
              }))

              //Alert Address
              unsignedTx.addOutput(new bsv.Transaction.Output({
                script: bsv.Script.buildPublicKeyHashOut(bsv.Address.fromString(receiverPBK.current.value)),
                satoshis: 1,
              }))
              .change(changeAddress)
          }
          else
          {
              unsignedTx.addOutput(new bsv.Transaction.Output({
                script: nextInstance.lockingScript,
                satoshis: balance,
              }))
              .change(changeAddress)
          }
    
          return Promise.resolve({
              tx: unsignedTx,
              atInputIndex: 0,
              nexts: [
              ]
          });              
        });

        console.log('this.alice: ', instance2.alice)
        console.log('PubKey(toHex(pbkey): ', (toHex(pbkey)))
        console.log('Hash PubKey(toHex(pbkey): ', hash160(toHex(pbkey)))
               
        /////////////////////////////////////////////////////////////////
        // Jesus is the Lord
        //  Oracle
        /////////////////////////////////////////////////////////////////

        let txid01 = txid.current.value
        let index01 = posNew1
        let txid02 = '00'
        let index02 = 0
        let networkOc = 'test'
  
        if(homenetwork !== bsv.Networks.testnet)
        {
          networkOc = 'main'
        }
  
        //Dummy Sig for FEE Calculations
        let sigOracle = toByteString('3047022300000026ecfbba3be4b8727e5eb7cfda955907bfe9788c5453847da76d84d6b41d50ae022071a713ba84465a30aaa51b2e0f2880b9f38d46e158fd6ef472f0c33fd57275e741')

        console.log('Pub Key: ', toHex(pbkey))

        const partialTx = await instance2.methods.sellOrder(
          sigOracle,
          (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey)),
          !orderCancel,
          nextInstance.price,
          pbkeyUserX,
          { multiContractCall: true, } as MethodCallOptions<GeneralTokenV3EcdsaOracleMin>
        )

        let primgHash =  ''

        //////////////////////////////////////////////////////////////////
        //  Contexto Dummy
        //    Para Criar a Preimage
        //////////////////////////////////////////////////////////////////
        SmartContract.dummyFlagOff() //Erros nos tests mostraram necessário
        { 
          const { tx: callTxDummy, nexts } = await SmartContract.multiContractCallDummy(
            partialTx,
            signer,
          )

          //Se não fizer o broadcast 

          primgHash =  (hash256(toHex(callTxDummy.inputs[0].getPreimage(callTxDummy,0))))
          console.log('preimage: ', hash256(toHex(callTxDummy.inputs[0].getPreimage(callTxDummy,0))))
          console.log('preimage: ', (toHex(callTxDummy.inputs[0].getPreimage(callTxDummy,0))))

          console.log("hashvouts Dummy: ", callTxDummy.outputs)
          console.log("TX Dummy: ", toHex(callTxDummy).substring(toHex(callTxDummy).length - 200))
          //console.log("vouts 0 hash: ", sha256(toHex(callTxDummy.outputs[0].script.toHex())))
          //console.log("vouts 1 sc: ", toHex(callTxDummy.outputs[1].script.toHex()))
          //console.log("vouts 1 sc: ", toHex(callTxDummy.outputs[1].script.toHex()))

          for(let i = 2; i < callTxDummy.outputs.length; i++ )
          {
            console.log("vouts "+ i + " sc: ", toHex(callTxDummy.outputs[i].script.toHex()))
          }
        }

        const witnessServer = 'https://oracle01.vercel.app/v1'

        const responseECDSA = await oracleWoC(`${witnessServer}/certifyECDSAmin/${txid01}/${index01}/${primgHash}/${networkOc}`)
        
        console.log('Response Oracle: ', (responseECDSA[0].sigDER))

        //Assinatura do Oraculo

        sigOracle = toByteString(responseECDSA[0].sigDER)

        const partialTx2 = await instance2.methods.sellOrder(
          sigOracle, 
          (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey)),
          !orderCancel,
          nextInstance.price,
          pbkeyUserX,    
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

        console.log('TXID New State: ', callTx.id)           
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
        console.error('Send Order fails', e)
        alert('Send Order fails')
        setdeptxid("")
      }
    }
    else
    {
      alert('Wrong TXID Format / or price')
      setdeptxid("Try Again!!!")
    }
  };

  return (
    <div className="App">
        <header className="App-header">

        <h2 style={{ fontSize: '34px', paddingBottom: '5px', paddingTop: '5px'}}>

          <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>   
          GPToken ECDSA-Soft Oracle - Order Lock
  
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

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={orderValue} type="number" name="PVTKEY1" min="1" placeholder="price (satoshis)" />
                </label>     
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={receiverPBK} type="hex" name="PVTKEY1" min="1" placeholder="Buyer Address (optional)" />
                </label>     
          </div>


          <div style={{ textAlign: 'center' }}>     
                <button className="insert" onClick={interact}
                    style={{ fontSize: '14px', paddingBottom: '2px', marginLeft: '0px'}}
                >Send Order</button>
          </div>

        </div>

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

export default PageSC11GPTokenOrdLock;
