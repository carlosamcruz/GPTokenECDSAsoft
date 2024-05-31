////////////////////////////////////////////////////////////////////////////////
// JESUS is the LORD of ALL
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
//General Purpose Token
////////////////////////////////////////////////////////////

import {
    method,
    prop,
    SmartContract,
    hash256,
    assert,
    ByteString,
    SigHash, PubKey, FixedArray, fill, Sig, hash160, toByteString, Utils, sha256, PubKeyHash, int2ByteString, len, slice, reverseByteString
} from 'scrypt-ts'

export class GeneralTokenV3EcdsaOracleMin extends SmartContract {
    // Stateful property to store counters value.
    @prop()
    readonly tokenType: ByteString; // data.

    @prop()
    readonly oraclePKEC: PubKey; // oracles public Key

    @prop()
    readonly totalSupply: bigint; // data.

    @prop()
    readonly idData: ByteString; // data.

    @prop(true)
    alice: PubKeyHash; // alice's public Key
    
    @prop(true)
    data: ByteString; // data.

    @prop(true)
    sell: boolean; // data.

    @prop(true)
    price: bigint; // data.

    @prop(true)
    thisSupply: bigint; // data.

    @prop(true)
    toBuyer: PubKeyHash; // alice's public Key

    @prop(true)
    genesisTX: ByteString; // Branches in which token grew.

    constructor(alice: PubKeyHash, totalSupply: bigint, idData: ByteString
        , oraclePKEC: PubKey
        ) {            
        super(...arguments);
        this.totalSupply = totalSupply
        this.idData = idData
        this.thisSupply = this.totalSupply

        this.alice = alice;
        this.data = toByteString('');
        this.sell = false
        this.price = 0n
        this.toBuyer = this.alice

        this.genesisTX = toByteString('');//Necessário comparar Genesis TX com ''

        //General Purpose Token ECDSA Oracle Min = 47656e6572616c20507572706f736520546f6b656e204543445341204f7261636c65204d696e
        this.tokenType = toByteString('47656e6572616c20507572706f736520546f6b656e204543445341204f7261636c65204d696e');

        this.oraclePKEC = oraclePKEC
    }
     
    @method()    
    public setupToken(  
        sigOracle: ByteString, 
        sig: Sig, pubkey: PubKey, finish: boolean, newData: ByteString, 
        ) {    

        assert(hash160(pubkey) == this.alice, "Bad public key")
        //assert(this.checkSig(sig, this.alice), `checkSig failed, pubkey: ${this.alice}`);
        assert(this.checkSig(sig, pubkey), `checkSig failed, pubkey: ${this.alice}`);
        // build the transation outputs

        let outputs = toByteString('');

        if(finish)
        {
            //outputs = Utils.buildPublicKeyHashOutput(hash160(this.alice), this.ctx.utxo.value);
            outputs = Utils.buildPublicKeyHashOutput(this.alice, this.ctx.utxo.value);
        }
        else
        //A unica operação permitida sem cerificação é a finalização do token
        //  nem mesmo interessa se a transação é genesis ou não
        //  ou se o token é falsificado, ou não
        {
            /////////////////////////////////////////////////////////
            //Jesus is the Lord!!!
            //
            // Solução para quebrar UTXO replicado
            // Cerificação ECDSA com Oraculo
            /////////////////////////////////////////////////////////
              
            assert(this.checkSig(Sig(sigOracle), this.oraclePKEC), `checkSig failed oracle certificate`);

            /////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////

            if(this.genesisTX === toByteString(''))
            {           
                this.genesisTX = reverseByteString(slice(this.prevouts, 0n, 32n), 32n) + this.tokenType
            }

            this.data = newData;
            outputs = this.buildStateOutput(this.ctx.utxo.value);
            
        }

        if(this.changeAmount > 0n) {
            outputs += this.buildChangeOutput();
        }

        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    public sellOrder(
        sigOracle: ByteString,  
        sig: Sig, pubkey: PubKey, sell: boolean, price: bigint, toBuyer: PubKeyHash,
        ) {        

        /////////////////////////////////////////////////////////
        //Jesus is the Lord!!!
        //
        // Solução para quebrar UTXO replicado
        // Cerificação ECDSA com Oraculo
        /////////////////////////////////////////////////////////
          
        assert(this.checkSig(Sig(sigOracle), this.oraclePKEC), `checkSig failed oracle certificate`);

        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////

        assert(hash160(pubkey) == this.alice, "Bad public key")
        //assert(this.checkSig(sig, this.alice), `checkSig failed, pubkey: ${this.alice}`);
        assert(this.checkSig(sig, pubkey), `checkSig failed, pubkey: ${this.alice}`);
       
        //(a || b) && !(a && b) = XOR
        //(this.sell || sell) && !(this.sell && sell)
        assert((this.sell || sell) && !(this.sell && sell) , `checkSig failed, For Sele state alredy set as: ${sell}`);

        
        this.sell = sell

        if(sell)
        {
            /////////////////////////////////////////////////////////
            //Jesus is the Lord!!!
            //
            // Solução para quebrar UTXO replicado
            // Also a L1 Back to Genesis Solution
            /////////////////////////////////////////////////////////

            if(this.genesisTX === toByteString(''))
            {           
                this.genesisTX = reverseByteString(slice(this.prevouts, 0n, 32n), 32n) + this.tokenType
            }
            /////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////

            this.price = price
            //Ordem preferencial
            this.toBuyer = toBuyer //sempre mudar - pois pode chegar de outro endereço
        }
        else
        {
            this.price = 0n
            this.toBuyer = this.alice
            //outputs = this.buildStateOutput(this.ctx.utxo.value);
        }

        // build the transation outputs
        let outputs = toByteString('');

        outputs = this.buildStateOutput(this.ctx.utxo.value);
        //Alert Output

        if(this.toBuyer != this.alice)
        {
            outputs += Utils.buildPublicKeyHashOutput(this.toBuyer, 1n);
        }

        if(this.changeAmount > 0n) {
            outputs += this.buildChangeOutput();
        }

        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    //mesmo qualquer um podendo pagar, o comprador deve assinar para podemos 
    //  ter a preimage e o oraculo poder assinar também
    // Correção: como o contrato é statful a preimage será produzida de qualquer forma
    //  então, não precisa da assinatura do comprador;
    @method()
    public buying(
        sigOracle: ByteString, 
        newOwner: PubKeyHash, 
        price: bigint, 
        ) {        

        /////////////////////////////////////////////////////////
        //Jesus is the Lord!!!
        //
        // Solução para quebrar UTXO replicado
        // Cerificação ECDSA com Oraculo
        /////////////////////////////////////////////////////////
          
        assert(this.checkSig(Sig(sigOracle), this.oraclePKEC), `checkSig failed oracle certificate`);

        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////            

        assert(this.sell, `Order failed, Not Selling`);
        assert(price >= this.price, `checkSig failed, Ask not Met`);

        if(this.toBuyer !== this.alice)
        {
            assert(this.toBuyer === newOwner, `Order failed, not the preferential buyer`);
        }

        assert(newOwner !== this.alice, `Current Owner Cannot Buy, Only Cancel Order`);


        /////////////////////////////////////////////////////////
        //Jesus is the Lord!!!
        //
        // Solução para quebrar UTXO replicado
        /////////////////////////////////////////////////////////

        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////

        // build the transation outputs
        let outputs = toByteString('');
    

        let lastAlice = this.alice
        this.alice = newOwner
        this.sell = false
        this.price = 0n

        outputs = this.buildStateOutput(this.ctx.utxo.value);            
        outputs += Utils.buildPublicKeyHashOutput(lastAlice, price);

        //Alert Output
        outputs += Utils.buildPublicKeyHashOutput(newOwner, 1n);

        if(this.changeAmount > 0n) {
            outputs += this.buildChangeOutput();
        }

        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    //Esta operação de split é critica para manter a quantidade de tokens de genesis incorruptível
    //Se os outputs vierem de fora, o contrato perde o controle do numero de tokens
    //Se tivermos mais de 2 outputs, o script do contrato cresce de forma forma ineficiente
    //O split generico mais eficiente tem somente 2 outputs de contrato
    @method()
    public split(
        sigOracle: ByteString,
        sig: Sig, pubkey: PubKey, numberOfSendTokens: bigint, toNewOwner: PubKeyHash,
        ) {    

        /////////////////////////////////////////////////////////
        //Jesus is the Lord!!!
        //
        // Solução para quebrar UTXO replicado
        // Cerificação ECDSA com Oraculo
        /////////////////////////////////////////////////////////
          
        assert(this.checkSig(Sig(sigOracle), this.oraclePKEC), `checkSig failed oracle certificate`);

        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
            
        assert( (numberOfSendTokens > 0) && (numberOfSendTokens <= this.thisSupply), `insuficient supply fund!!`);
        assert(hash160(pubkey) == this.alice, "Bad public key")
        assert(this.checkSig(sig, pubkey), `checkSig failed, pubkey: ${this.alice}`);

        /////////////////////////////////////////////////////////
        //Jesus is the Lord!!!
        //
        // Solução para quebrar UTXO replicado
        /////////////////////////////////////////////////////////
        
        if(this.genesisTX === toByteString(''))
        {           
            this.genesisTX = reverseByteString(slice(this.prevouts, 0n, 32n), 32n) + this.tokenType
        }
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////

        let outputs1 = toByteString('');
        let outputs = toByteString('');

        if(this.thisSupply == numberOfSendTokens)
        {
            this.alice = toNewOwner
            outputs = this.buildStateOutput(this.ctx.utxo.value);
            //Alert Output
            //outputs += Utils.buildPublicKeyHashOutput(hash160(this.alice), 1n);
            outputs += Utils.buildPublicKeyHashOutput(this.alice, 1n);
        }
        else
        {                  
            this.thisSupply = this.thisSupply - numberOfSendTokens
            outputs1 = this.buildStateOutput(this.ctx.utxo.value);
            
            this.alice = toNewOwner
            this.thisSupply = numberOfSendTokens

            //outputs += this.buildStateOutput(this.ctx.utxo.value);
            outputs = this.buildStateOutput(this.ctx.utxo.value) + outputs1;
            //Alert Output
            //outputs += Utils.buildPublicKeyHashOutput(hash160(this.alice), 1n);
            outputs += Utils.buildPublicKeyHashOutput(this.alice, 1n);
        }

        if(this.changeAmount > 0n) {
            outputs += this.buildChangeOutput();
        }

        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    public mergeTokens(
        sigOracle: ByteString,
        sig: Sig, pubkey: PubKey, 
        Supply1: bigint, Supply2: bigint, 
    ) { 
       
        /////////////////////////////////////////////////////////
        //Jesus is the Lord!!!
        //
        // Solução para quebrar UTXO replicado
        // Cerificação ECDSA com Oraculo
        /////////////////////////////////////////////////////////
          
        assert(this.checkSig(Sig(sigOracle), this.oraclePKEC), `checkSig failed oracle certificate`);

        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
    
        assert(hash160(pubkey) == this.alice, "Bad public key")
        assert(this.checkSig(sig, pubkey), `checkSig failed, pubkey: ${this.alice}`);

        /////////////////////////////////////////////////////////
        //Jesus is the Lord!!!
        //
        // Solução para quebrar UTXO replicado
        // Also a L1 Back to Genesis Solution
        /////////////////////////////////////////////////////////
                
        //Não é possível fazer merge com Genesis TX;
        //Os token não podem vir de cadeias diferentes, este não passaram pelo teste B2G

        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////

        // build the transation outputs
        let outputs = toByteString('');
        this.thisSupply = Supply1 + Supply2
     
        outputs = this.buildStateOutput(this.ctx.utxo.value);
        outputs += Utils.buildPublicKeyHashOutput(this.alice, this.ctx.utxo.value);       

        if(this.changeAmount > 0n) {
            outputs += this.buildChangeOutput();
        }

        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }
}
