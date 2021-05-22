<template>
  <div id="nomination-dialog">
    <md-snackbar :md-duration="Infinity" :md-active.sync="showExtrinsicSnakeBar" md-persistent>
      <span>Extrinsic Status: {{extrinsicStatus}}</span>
      <md-button class="md-accent" @click="showSnackbar = false">OK</md-button>
    </md-snackbar>
    <v-stepper v-model="e1">
      <v-stepper-header>
        <v-stepper-step
          color= #61ba89
          :complete="e1 > 1"
          step="1"
        >
          Nomination
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step
          color= #61ba89
          :complete="e1 > 2"
          step="2"
        >
          Result
        </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <v-card class="mb-12">
            <v-card-title class="nomination-title mb-4">
              <div class="d-flex flex-row">
                <div>
                  <Identicon class="ident-icon" @click.native="copy(walletAddress)"
                  :size="32"
                  :theme="'polkadot'"
                  :value="walletAddress" />
                </div>
                <div class="align-self-center ml-2">{{walletAddress}}</div>
              </div>
            </v-card-title>
            <v-card-text>
              <div class='d-flex flex-column align-start'>
                <div class='mb-2'><span class='subtitle-2'>Bonded Amount:</span> <v-chip class="ml-2"
                  v-bind:class="{ 'valid-item': bondedAmount > 0, 'invalid-item': bondedAmount === 0 }">
                  {{bondedAmount.toFixed(3)}} {{coinName}}
                </v-chip> / {{totalAmount}} {{coinName}}</div>
                <div class='mb-2'><span class='subtitle-2'>Status:</span>
                <v-chip class="ml-2" v-bind:class="{ 'valid-item': role === 'OK', 'invalid-item': role !== 'OK' }">
                  {{role}}
                </v-chip>
                </div>
                <div class='mt-4 d-flex flex-column'>
                  <v-btn @click="becomeNominator" color="#61ba89" class="white--text" v-if="bondedAmount === 0 && role !== 'Not a Nominator' && !showBondBox">Bond</v-btn>
                  <v-text-field
                    v-model="amountToBond"
                    label="Amount (KSM)"
                    v-if="showBondBox"
                    :rules="validateBondAmount"
                    class="shrink mt-2"
                  ></v-text-field>
                </div>
              </div>
            </v-card-text>
            <v-card-title class="nomination-title mb-4">
              Validators to Nominate ({{validators.length}}/16)
            </v-card-title>
            <div class='card-container' v-for="(validator, index) in validators" :key="index">
              <validator-card
              v-bind:displayName="validator.identity.display || validator.id" v-bind:activeKSM="validator.activeKSM || 0"
              v-bind:allKSM="validator.inactiveKSM || 0"
              v-bind:stash="validator.id"
              v-bind:nominators="validator.info.nominators"
              v-bind:commission="validator.info.commission"
              v-bind:isLoading="validator.isLoading"
              v-bind:favorite.sync="validator.isMissing"
              v-bind:apy="validator.info.apy"
              v-bind:stalePayouts="validator.info.unclaimedEras.length >= 20"
              v-bind:coinName="coinName"/>
            </div>
          </v-card>

          <v-btn
            color="#61ba89"
            @click="onNominate()"
            :disabled="validated === false"
          >
            Continue
          </v-btn>

          <v-btn text @click="$emit('close'); e1=1;">
            Cancel
          </v-btn>
        </v-stepper-content>

        <v-stepper-content step="2">
          <v-card
            class="mb-12"
          >
            <v-card-title class="nomination-title mb-4" v-bind:class="{'nomination-title-error': blockHash === ''}"> Result </v-card-title>
            <v-card-text v-if="blockHash !== ''">
              Thank you for staking with <span style="#61ba89">CryptoLab</span>.<br>
              You can check the result from {{`https://polkascan.io/kusama/block/${blockHash}`}}
            </v-card-text>
            <v-card-text v-if="showNominateExtrinsicsFail">
              {{nominateExtrinsicsFailedMsg}}
            </v-card-text>
          </v-card>

          <v-btn text
            color=#81ba89
            @click="$emit('close'); e1=1;">
            OK
          </v-btn>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </div>
</template>

<script>
/* global BigInt */
import constants from '../../scripts/constants';
import Identicon from '@polkadot/vue-identicon';
import ValidatorCard from '../validatorTools/ValidatorCard';
import divide from 'divide-bigint';
import { EventBus } from '../../main';
export default {
  name: 'NominationDialog',
  props: {
    coinName: String,
    rpc: Object,
    stash: String,
    validators: Array,
  },
  data: function() {
    return {
      e1: 1,
      walletAddress: '',
      account: undefined,
      bondedAmount: 0,
      totalAmount: 0,

      role: '',
      validated: false,
      amountToBond: '0',

      showBondBox: false,
      showExtrinsicSnakeBar: false,
      extrinsicStatus: '',
      validateBondAmount: [
        value => !!value || 'Required.',
        value => !isNaN(value) || 'Must be a number',
        value => (value < (this.totalAmount)) || 'Must not over your total amount of funds',
      ],

      blockHash: '',
      showNominateExtrinsicsFail: false,
      ominateExtrinsicsFailedMsg: '',
    }
  },
  mounted: async function() {
    await this.onStashChanged();
    EventBus.$on('extrinsicStatus', (status)=>{
      this.showExtrinsicSnakeBar = true;
      this.extrinsicStatus = status.type;
    })
  },
  watch: {
    stash: async function() {
      await this.onStashChanged();
    },
    amountToBond: function() {
      if(parseFloat(this.amountToBond) > 0) {
        this.bondedAmount = parseFloat(this.amountToBond);
        if(this.role === constants.accountRoles.notNominator) {
          this.role = constants.accountRoles.controller;
          this.validated = true;
        }
      } else {
        this.bondedAmount = 0;
        this.role = constants.accountRoles.notNominator;
        this.validated = false;
      }
    }
  },
  methods: {
    becomeNominator: async function() {
      this.showBondBox = true;
    },
    onNominate: async function() {
      try {
        await this.nominate();
      } catch(err) {
        console.error(err);
      }
      this.e1 = 2;
    },
    onStashChanged: async function() {
      this.showBondBox = false;
      this.validated = false;
      this.role = constants.accountRoles.unknown;
      const address = this.stash;
      if(address !== null) {
        const accounts = await this.rpc.getAccountsFromExtension();
        if(accounts.length === 0) {
          this.showConnectWalletFirst = true;
          return;
        }
        const index = accounts.findIndex((account)=>{
          return this.transformAddress(account.address, this.coinName) === address;
        });
        if(index >= 0) {
          this.walletAddress = address;
          this.account = accounts[index];
          const accountInfo = await this.rpc.getAccountInfo(this.walletAddress);
          const sum = BigInt(accountInfo.data.free) +
            BigInt(accountInfo.data.reserved);
          this.totalAmount = parseFloat(divide(sum, constants.KUSAMA_DECIMAL).toFixed(3));
          this.bondedAmount = accountInfo.data.miscFrozen.toNumber() / constants.KUSAMA_DECIMAL;
          console.log(this.totalAmount, this.bondedAmount);
          this.amountToBond = this.bondedAmount.toString();
          if(accountInfo.data.miscFrozen.toNumber() === 0) {
            // TODO: error handling
          }
          let controller = await this.rpc.getController(this.walletAddress);
          console.log(controller);
          if(controller === 'None') {
            if(!this.rpc.isController(this.walletAddress)) {
              this.role = constants.accountRoles.notNominator;
              // TODO: help the user to bond the account
              return;
            }
          }
          const isValidator = await this.rpc.isValidator(this.walletAddress);
          if(isValidator) {
            this.role = constants.accountRoles.validator;
            return;
          }
          const isValidatorController = await this.rpc.isValidatorController(this.walletAddress);
          if(isValidatorController) {
            this.role = constants.accountRoles.validatorController;
            return;
          }
          this.role = constants.accountRoles.controller;
          if(this.amountToBond > 0) {
            this.validated = true;
          }
        }
      }
    },
    nominate: async function() {
      this.blockHash = '';
      const tx = [];
      try {
        if(this.showBondBox === true) {
          tx.push(this.rpc.getBondExtrinsic(this.walletAddress, this.bondedAmount));
        }
        tx.push(this.rpc.getNominateExtrinsic(this.validators.reduce((acc, v)=>{
          acc.push(v.id);
          return acc;
        }, [])));
        const blockHash = await this.rpc.batchSignAndSend(this.account, tx);
        // nominated
        this.showNominated = true;
        this.blockHash = blockHash;
        console.log(blockHash);
      } catch(e) {
        this.showNominateExtrinsicsFail = true;
        this.nominateExtrinsicsFailedMsg = 'Extrinsics failed: Failed to call Extrinsics.\n(' + e.message + ')';
        console.error(e.message);
      }
    },
    transformAddress(addr, type) {
      switch(type) {
        case 'KSM':
          return this.rpc.transformAddressFromSubstrate(addr, 2);
        case 'DOT':
          return this.rpc.transformAddressFromSubstrate(addr, 1);
      } 
    },
  },
  components: {
    Identicon,
    ValidatorCard,
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  .valid-item {
    background-color: #61ba89 !important;
    color: #fafafa !important;
  }
  .invalid-item {
    background-color: #ba6192 !important;
    color: #fafafa !important;
  }
  .nomination-title {
    background-color: #61ba89 !important;
    color: #fafafa !important;
  }
  .nomination-title-error {
    background-color: #ba6192 !important;
  }
  .card-container {
    width: 8%;
    min-width: 290px;
    margin-top: 12px;
    margin-bottom: 10px;
    position: relative;
    display: inline-block;
    background-color:#404b55;
    vertical-align: top;
  }
</style>