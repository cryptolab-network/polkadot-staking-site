const Api = require('@polkadot/api');
const extension = require('@polkadot/extension-dapp');
const utilCrypto = require('@polkadot/util-crypto');

const Yaohsin = require('./yaohsin');
const constants = require('../scripts/constants');

import { EventBus } from '../main';

const { ApiPromise, WsProvider} = Api;
const {
  web3Accounts,
  web3Enable,
  web3FromAddress,

  // web3ListRpcProviders,
  // web3UseRpcProvider
} = extension;
const {
  encodeAddress, decodeAddress
} = utilCrypto;

class Polkadot {
  constructor(type) {
    this.yaohsin = new Yaohsin();
    this.type = type;
  }

  async connect() {
    let rpc = ['wss://kusama-rpc.polkadot.io', 'wss://kusama.api.onfinality.io/public-ws'];
    switch(this.type) {
      case 'DOT':
        rpc = ['wss://rpc.polkadot.io', 'wss://polkadot.api.onfinality.io/public-ws'];
        break;
    }
    //wss://westend-rpc.polkadot.io  wss://kusama-rpc.polkadot.io
    const wsProvider = new WsProvider(rpc);
    this.api = await ApiPromise.create({ provider: wsProvider });
    setInterval(()=>{
      this.api.disconnect().then(()=>{
        this.api.connect();
      });
    }, 3600000);
  }

  async retrieveValidators() {
    this.addrs = [
      {
        displayName: 'DRAGONLANCE',
        addr: 'H4EeouHL5LawTqq2itu6auF62hDRX2LEBYk1TxS6QMrn9Hg'
      },
      {
        displayName: 'Hsinchu',
        addr: 'CjU6xRgu5f9utpaCbYHBWZGxZPrpgUPSSXqSQQG5mkH9LKM'
      },
      {
        displayName: 'Taiwan 001',
        addr: 'GCNeCFUCEjcJ8XQxJe1QuExpS61MavucrnEAVpcngWBYsP2'
      },
      {
        displayName: 'TAICHUNG',
        addr: 'EMrTktHLYSHAqpVH3f2KMMoLkZPMWjeQAZLpZTJ6KgNcXVr'
      },
      {
        displayName: 'KRYNN',
        addr: 'HRfhckygfiHkqVW19e71R2pXNbR6om7138sLAJENt2Tw1HF'
      },
    ];
    try {
      // add random validators from 1kv list
      const onekvDetailedList = await this.yaohsin.getOneKVDetailedInfo({
        rate: 0.3,
        totalNominators: 20,
        ignoredValidators: [
          'H4EeouHL5LawTqq2itu6auF62hDRX2LEBYk1TxS6QMrn9Hg', 'CjU6xRgu5f9utpaCbYHBWZGxZPrpgUPSSXqSQQG5mkH9LKM',
          'GCNeCFUCEjcJ8XQxJe1QuExpS61MavucrnEAVpcngWBYsP2',
          'EMrTktHLYSHAqpVH3f2KMMoLkZPMWjeQAZLpZTJ6KgNcXVr',
          'HRfhckygfiHkqVW19e71R2pXNbR6om7138sLAJENt2Tw1HF',
        ]
      });
      const onekvList = onekvDetailedList.valid.reduce((acc, v)=>{
        if(v.stakingInfo !== undefined && v.stakingInfo !== null) {
          console.log(v.stakingInfo);
          acc.push({
            addr: v.stakingInfo.stashId,
            displayName: v.name,
          });
        }
        return acc;
      }, []);
      const randomSelected = this.yaohsin.getRandomValidators(onekvList, 11);
      if(Array.isArray(randomSelected)) {
        this.addrs = this.addrs.concat(randomSelected);
      }
      return this.addrs;
    } catch(err) {
      console.error(err);
    }
  }

  async getAccountsFromExtension() {
    // returns an array of all the injected sources
    // (this needs to be called first, before other requests)
    const extensions = await web3Enable('CryptoLab');

    if (extensions.length === 0) {
      // no extension installed, or the user did not accept the authorization
      // in this case we should inform the use and give a link to the extension
      return;
    }
    const allAccounts = await web3Accounts();
    console.log(allAccounts);
    return allAccounts;
    // returns an array of { address, meta: { name, source } }
    // meta.source contains the name of the extension that provides this account
    // const allAccounts = await web3Accounts();

    // the address we use to use for signing, as injected
    // const SENDER = '5DTestUPts3kjeXSTMyerHihn1uwMfLj8vU8sqF7qYrFabHE';

    // finds an injector for an address
    // const injector = await web3FromAddress(SENDER);
    
    // this.api.tx.nominate
  }

  async getAccountInfo(addr) {
    const accountInfo = await this.api.query.system.account(addr);
    return accountInfo;
  }

  async _signAndSend(account, extrinsic) {
    // to be able to retrieve the signer interface from this account
    // we can use web3FromSource which will return an InjectedExtension type
    const injector = await web3FromAddress(account.address);

    // passing the injected account address as the first argument of signAndSend
    // will allow the api to retrieve the signer and the user will see the extension
    // popup asking to sign the balance transfer transaction
    const promise = new Promise((resolve, reject)=>{
      extrinsic.signAndSend(account.address, { signer: injector.signer }, ({ status }) => {
        if (status.isInBlock) {
          console.log(`Completed at block hash #${status.asInBlock.toString()}`);
          resolve(status.asInBlock.toString());
        } else {
          console.log(`Current status: ${status.type}`);
        }
      }).catch((error) => {
        console.log(':( transaction failed', error);
        reject(error);
      });
    });
    return promise;
  }

  async batchSignAndSend(account, batch) {
    // to be able to retrieve the signer interface from this account
    // we can use web3FromSource which will return an InjectedExtension type
    const injector = await web3FromAddress(account.address);

    // passing the injected account address as the first argument of signAndSend
    // will allow the api to retrieve the signer and the user will see the extension
    // popup asking to sign the balance transfer transaction
    const promise = new Promise((resolve, reject)=>{
      this.api.tx.utility.batch(batch).signAndSend(account.address, { signer: injector.signer }, ({ status }) => {
        if (status.isInBlock) {
          console.log(`Completed at block hash #${status.asInBlock.toString()}`);
          resolve(status.asInBlock.toString());
        } else {
          console.log(`Current status: ${status.type}`);
          EventBus.$emit('extrinsicStatus', status);
        }
      }).catch((error) => {
        console.log(':( transaction failed', error);
        reject(error);
      });
    });
    return promise;
  }
  
  transformAddressFromSubstrate(addr, toPrefix) {
    const decoded = decodeAddress(addr);
    return encodeAddress(decoded, toPrefix);
  }

  async getController(account) {
    try {
      const bonded = await this.api.query.staking.bonded(account);
      return bonded.unwrap().toString();
    } catch(e) {
      return 'None';
    }
  }

  async bond(account, addr, balance) {
    const extrinsic = await this.api.tx.staking.bond(addr, balance * constants.KUSAMA_DECIMAL, 0);
    return this._signAndSend(account,extrinsic);
  }

  async bondExtra(account, balance) {
    const extrinsic = await this.api.tx.staking.bondExtra(balance * constants.KUSAMA_DECIMAL);

    return this._signAndSend(account, extrinsic);
  }

  async nominate(account, nominees) {
    const extrinsic = await this.api.tx.staking.nominate(nominees);
    return this._signAndSend(account, extrinsic);
  }

  getBondExtrinsic(addr, balance) {
    return this.api.tx.staking.bond(addr, balance * constants.KUSAMA_DECIMAL, 0);
  }

  getBondExtraExtrinsic(balance) {
    return this.api.tx.staking.bondExtra(balance * constants.KUSAMA_DECIMAL);
  }

  getNominateExtrinsic(nominees) {
    return this.api.tx.staking.nominate(nominees);
  }

  async getBlockInfo(blockHash) {
    const signedBlock = await this.api.rpc.chain.getBlock(blockHash);

    // the information for each of the contained extrinsics
    signedBlock.block.extrinsics.forEach((ex, index) => {
      // the extrinsics are decoded by the API, human-like view
      console.log(index, ex.toHuman());

      const { isSigned, meta, method: { args, method, section } } = ex;

      // explicit display of name, args & documentation
      console.log(`${section}.${method}(${args.map((a) => a.toString()).join(', ')})`);
      console.log(meta.documentation.map((d) => d.toString()).join('\n'));

      // signer/nonce info
      if (isSigned) {
        console.log(`signer=${ex.signer.toString()}, nonce=${ex.nonce.toString()}`);
      }
    });
  }
}
const kusamaRpc = new Polkadot('KSM');
const polkadotRpc = new Polkadot('DOT');
export {kusamaRpc, polkadotRpc};