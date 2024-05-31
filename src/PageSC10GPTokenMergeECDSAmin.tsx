import React, { useRef, FC, useState} from 'react';

import './App.css';

import { DefaultProvider, MethodCallOptions, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString, hash160, buildPublicKeyHashScript, findSig, SignatureResponse, ContractTransaction, SmartContract, PubKeyHash, reverseByteString, int2ByteString, hash256 } from "scrypt-ts";

import { GeneralTokenV3EcdsaOracleMin } from "./contracts/generaltokenV3ecdsaOracleMin";

import {homepvtKey, homenetwork, compState} from './Page02Access';
import { oracleWoC} from './mProviders';
import { scriptUxtoSize, hexToLittleEndian } from "./myUtils";


//const provider = new DefaultProvider({network: bsv.Networks.testnet});
const provider = new DefaultProvider({network: homenetwork});
let Alice: TestWallet

let txlink2 = ""

function PageSC10GPTokenMerge() {
//const  deployACT: FC = () => {  

  const [deployedtxid, setdeptxid] = useState("");
  const labelRef = useRef<HTMLLabelElement | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  //const [txid2, setTxid] = useState("");
  const txid = useRef<any>(null);
  const txid2 = useRef<any>(null);
  const tokenIndex = useRef<any>(null);
  const tokenIndex2 = useRef<any>(null);

  const interact = async (amount: any) => {
    setdeptxid("Wait!!!")

    if((txid.current.value.length === 64 && txid2.current.value.length === 64) 
      )
    {


      let posNew1 = 0 // Output Index of the Contract in the Current State TX
      let posNew2 = 0 // Output Index of the Contract in the Current State TX


      if(tokenIndex.current.value === '1')
      {
        posNew1 = 1
      }

      if(tokenIndex2.current.value === '1')
      {
        posNew2 = 1
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
        //const balance = 1000
  
  
        //Linha necessária nesta versão
        //O signee deve ser connectado
        await signer.connect(provider)
  
        
        //const message = toByteString('hello world', true)
        let tx = new bsv.Transaction
        let tx2 = new bsv.Transaction

        //////////////////////////////////////////////////////
        //Jesus is the Lord
        //////////////////////////////////////////////////////

        tx = await provider.getTransaction(txid.current.value)
        tx2 = await provider.getTransaction(txid2.current.value)
    
        //////////////////////////////////////////////////////
        //////////////////////////////////////////////////////
  
    
        console.log('Current State TXID: ', tx.id)
  
        let instance2 = GeneralTokenV3EcdsaOracleMin.fromTx(tx, posNew1)
        //Inform to the system the right output index of the contract and its sequence
        tx.pvTxIdx(tx.id, posNew1, sha256(tx.outputs[posNew1].script.toHex()))

        let instance3 = GeneralTokenV3EcdsaOracleMin.fromTx(tx2, posNew2)
        //Inform to the system the right output index of the contract and its sequence
        tx.pvTxIdx(tx2.id, posNew2, sha256(tx2.outputs[posNew2].script.toHex()))
 
        let pbkey = bsv.PublicKey.fromPrivateKey(privateKey)
        let pvtkey = privateKey;

        //https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#method-with-signatures

        const balance = instance2.balance
        const nextInstance = instance2.next()

        await instance2.connect(signer)
        await instance3.connect(signer)
        const nextInstance3 = instance3.next()
    
        //Theory: https://docs.scrypt.io/advanced/how-to-call-multiple-contracts/

        instance2.bindTxBuilder(
          'mergeTokens',
          (
              current: GeneralTokenV3EcdsaOracleMin,
              options: MethodCallOptions<GeneralTokenV3EcdsaOracleMin>,
              ...args: any
          ): Promise<ContractTransaction> => {
              // create the next instance from the current
  
              const unsignedTx: bsv.Transaction = new bsv.Transaction()
              .addInputFromPrevTx(tx, posNew1)
  
              nextInstance.thisSupply = nextInstance.thisSupply + nextInstance3.thisSupply 
  
              unsignedTx.addOutput(new bsv.Transaction.Output({
                  script: nextInstance.lockingScript,
                  satoshis: balance, //balance é igual para as duas instancias
              }))
          
              return Promise.resolve({
                  tx: unsignedTx,
                  atInputIndex: 0,
                  nexts: [
                  ]
              })       
          }
        )

        instance3.bindTxBuilder(
          'mergeTokens',
          (
              current: GeneralTokenV3EcdsaOracleMin,
              options: MethodCallOptions<GeneralTokenV3EcdsaOracleMin>,
              ...args: any
          ): Promise<ContractTransaction> => {
              if (options.partialContractTx) {
  
                  const changeAddress = bsv.Address.fromPrivateKey(pvtkey)
         
                  const unsignedTx = options.partialContractTx.tx
  
                  unsignedTx.addInputFromPrevTx(tx2, posNew2)

                  unsignedTx.addOutput(new bsv.Transaction.Output({
                    //script: buildPublicKeyHashScript(hash160(instance2.alice)),
                    script: buildPublicKeyHashScript(instance2.alice),
                    satoshis: balance //balance é igual para as duas instancias
                  }))
                  .change(changeAddress)
                 
                  return Promise.resolve({
                      tx: unsignedTx,
                      atInputIndex: 1,
                      nexts: [
                      ]
                  })   
              }
  
              throw new Error('no partialContractTx found')
          }
        )
    

        /////////////////////////////////////////////////////////////////
        // Jesus is the Lord
        //  Oracle
        /////////////////////////////////////////////////////////////////

        let txid01 = txid.current.value
        // 2 TXIDs e Duas PubKeys, e Dois acessos ao Oraculo
        let index01 = posNew1
        let txid02 = txid2.current.value
        let index02 = posNew2
        let networkOc = 'test'
  
        if(homenetwork !== bsv.Networks.testnet)
        {
          networkOc = 'main'
        }
  
        //Dummy Sig for FEE Calculations
        let sigOracle = toByteString('3047022300000026ecfbba3be4b8727e5eb7cfda955907bfe9788c5453847da76d84d6b41d50ae022071a713ba84465a30aaa51b2e0f2880b9f38d46e158fd6ef472f0c33fd57275e741')
        let sigOracle2 = toByteString('3047022300000026ecfbba3be4b8727e5eb7cfda955907bfe9788c5453847da76d84d6b41d50ae022071a713ba84465a30aaa51b2e0f2880b9f38d46e158fd6ef472f0c33fd57275e741')

        console.log('Pub Key: ', toHex(pbkey))

        console.log('Number of Units in Tokens 2', instance2.thisSupply)
        console.log('Number of Units in Tokens 1', instance3.thisSupply)

        const partialTx = await instance2.methods.mergeTokens(
          sigOracle, //PubKey(toHex(pubKeyP2)),
          (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey)),
          instance2.thisSupply,
          instance3.thisSupply, //utxo2Fee,
          { multiContractCall: true, } as MethodCallOptions<GeneralTokenV3EcdsaOracleMin>
        )
    
        const finalTx = await instance3.methods.mergeTokens(
            sigOracle2, //PubKey(toHex(pubKeyP2b)),
            (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey)),
            instance2.thisSupply,
            instance3.thisSupply, //utxo2Fee,
            {
                multiContractCall: true,
                partialContractTx: partialTx,
            } as MethodCallOptions<GeneralTokenV3EcdsaOracleMin>,
        )
    
        let primgHash =  ''
        let primgHash2 =  ''

        //////////////////////////////////////////////////////////////////
        //  Contexto Dummy
        //    Para Criar a Preimage
        //////////////////////////////////////////////////////////////////
        SmartContract.dummyFlagOff() //Erros nos tests mostraram necessário
        { //const { tx: callTx, nexts } = await SmartContract.multiContractCall(
          const { tx: callTxDummy, nexts } = await SmartContract.multiContractCallDummy(
            finalTx,
            Alice,
          )
  
          //Se não fizer o broadcast 
  
          primgHash =  (hash256(toHex(callTxDummy.inputs[0].getPreimage(callTxDummy,0))))
          primgHash2 =  (hash256(toHex(callTxDummy.inputs[1].getPreimage(callTxDummy,1))))

          console.log('preimage Hash: ', hash256(toHex(callTxDummy.inputs[0].getPreimage(callTxDummy,0))))
          //console.log('preimage: ', (toHex(callTxDummy.inputs[0].getPreimage(callTxDummy,0))))
          console.log('preimage2 Hash: ', hash256(toHex(callTxDummy.inputs[1].getPreimage(callTxDummy,1))))
          //console.log('preimage2: ', (toHex(callTxDummy.inputs[1].getPreimage(callTxDummy,1))))
   
          console.log("hashvouts Dummy: ", callTxDummy.outputs)
          //console.log("TX Dummy: ", toHex(callTxDummy).substring(toHex(callTxDummy).length - 200))
          console.log("TX Dummy: ", toHex(callTxDummy))
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
        const responseECDSA2 = await oracleWoC(`${witnessServer}/certifyECDSAmin/${txid02}/${index02}/${primgHash2}/${networkOc}`)
        
        console.log('Response Oracle: ', (responseECDSA[0].sigDER))
        console.log('Response Oracle2: ', (responseECDSA2[0].sigDER))
  
        //Assinatura do Oraculo
  
        sigOracle = toByteString(responseECDSA[0].sigDER)
        sigOracle2 = toByteString(responseECDSA2[0].sigDER)
  
        const partialTx2 = await instance2.methods.mergeTokens(
          sigOracle, //PubKey(toHex(pubKeyP2)),
          (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey)),
          instance2.thisSupply,
          instance3.thisSupply, //utxo2Fee,
          { multiContractCall: true, } as MethodCallOptions<GeneralTokenV3EcdsaOracleMin>
        )
    
        const finalTx2 = await instance3.methods.mergeTokens(
            sigOracle2, //PubKey(toHex(pubKeyP2b)),
            (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey)),
            instance2.thisSupply,
            instance3.thisSupply, //utxo2Fee,
            {
                multiContractCall: true,
                partialContractTx: partialTx2,
            } as MethodCallOptions<GeneralTokenV3EcdsaOracleMin>,
        )
   
        ////////////////////////////////////////
        //Jesus is the Lord
        //Versão para Oraculo ECDSA
        ////////////////////////////////////////      

        //const { tx: callTx, nexts, raw } = await SmartContract.multiContractCallV2(
        const txRsult = await SmartContract.multiContractCallV2(  
          finalTx2,
          Alice,
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
        console.error('Merge fails', e)
        alert('Merge fails')
        setdeptxid("")
      }
    }
    else
    {
      alert('Wrong TXID Format')
      setdeptxid("Try Again!!!")
    }
  };

  return (
    <div className="App">
        <header className="App-header">

        <h2 style={{ fontSize: '34px', paddingBottom: '5px', paddingTop: '5px'}}>

          <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>   
          GPToken ECDSA-Soft Oracle - Merge
          
        </h2>

       
        <div>

          <div style={{ textAlign: 'center' , paddingBottom: '20px' }}>
                
                <label style={{ fontSize: '14px', paddingBottom: '2px' }}
                  >Inform Both Current State TXIDs:  
                </label>     
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={txid} type="hex" name="PVTKEY1" min="1" placeholder="current state Tk1" />
                </label>     
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={tokenIndex} type="number" name="PVTKEY1" min="1" placeholder="idxT1: 0 or 1 (0 default)" />
                </label>     
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={txid2} type="hex" name="PVTKEY1" min="1" placeholder="current state Tk2" />
                </label>     
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={tokenIndex2} type="number" name="PVTKEY1" min="1" placeholder="idxT2: 0 or 1 (0 default)" />
                </label>     
          </div>

          <div style={{ textAlign: 'center' }}>     
                <button className="insert" onClick={interact}
                    style={{ fontSize: '14px', paddingBottom: '2px', marginLeft: '0px'}}
                >Merge</button>
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

export default PageSC10GPTokenMerge;
