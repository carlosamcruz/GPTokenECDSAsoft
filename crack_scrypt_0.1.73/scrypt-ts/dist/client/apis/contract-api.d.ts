import { SmartContract } from "../../smart-contract/contract";
import { Core } from "../core/core";
import { ContractId } from "../core/types";
import { SupportedParamType, bsv } from "scryptlib";
/** A options can be used to subscribe */
export interface SubscribeOptions<T> {
    /** Contract id */
    id: ContractId;
    /** Contract typescript class */
    clazz: new (...args: any) => T;
    /** Use `methodNames` to specify that only receive events when specific methods are called. The default is to notify when all methods are called */
    methodNames?: Array<string>;
}
/** SubScription can be used to unsubscribe */
export interface SubScription {
    unsubscribe: () => void;
}
/**
 *  ContractCalledEvent is the relevant information when the contract is called, such as the public function name and function arguments when the call occurs.
 */
export interface ContractCalledEvent<T> {
    /**
     * If a stateful contract is called, `nexts` contains the contract instance containing the new state generated by this call.
     * If a stateless contract is called, `nexts` is empty.
     */
    nexts: Array<T>;
    /** name of public function */
    methodName: string;
    /** public function arguments */
    args: SupportedParamType[];
    /** transaction where contract is called */
    tx: bsv.Transaction;
}
export declare class ContractApi {
    private readonly _core;
    constructor(_core: Core);
    /** @ignore */
    syncHashedProps<T extends SmartContract>(instance: T): Promise<void>;
    /**
     * Get a contract instance containing the latest state of the contract by the contract ID.
     * The obtained contract instance may also be obtained by other users at the same time.
     * If other users call this contract instance. Then the contract instance will be invalid.
     * At this time, calling the contract will cause a `txn-mempool-conflict` error (that is, UTXO double spending).
     * If this error occurs, you need to re-acquire the contract instance
     * @param clazz
     * @param contractId
     * @returns a contract instance contains latest state
     */
    getLatestInstance<T extends SmartContract>(clazz: new (...args: any) => T, contractId: ContractId): Promise<T>;
    /**
     * Subscribe to notifications of contract status changes by contract ID,
     * @param options SubscribeOptions
     * @param cb
     * @returns a SubScription, which can be used to unsubscribe
     */
    subscribe<T extends SmartContract>(options: SubscribeOptions<T>, cb: (e: ContractCalledEvent<T>) => void): SubScription;
}