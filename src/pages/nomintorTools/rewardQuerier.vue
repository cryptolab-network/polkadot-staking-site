<template>
<div id="reward-querier">
  <md-toolbar>
      <div class="md-toolbar-row">
      <div class='md-toolbar-section-start search-bar '> 
        <md-icon id="search-icon">search</md-icon>
        <md-field>
          <md-autocomplete md-input-placeholder="Search for Stash ID" v-model="selectedStash" :md-options="historicalQuery"></md-autocomplete>
        </md-field>
      </div>
      </div>
  </md-toolbar>
  <v-layout class="pt-8" v-if="isLoading" justify-center align-center>
      <v-progress-circular 
      indeterminate
      color=#61ba89
      v-if="isLoading">
      </v-progress-circular>
  </v-layout>
  <div v-if="isStashValid && !isLoading" class="content">
    <div class="md-title stash-info-title mt-2 pt-4 pb-4 pl-4 header-card-light">Stash Information</div>
    <v-simple-table class="elevation-2 mt-4 mb-8">
      <template v-slot:default>
        <tbody>
          <tr>
            <td>Stash ID</td>
            <td>
              <div class="d-flex flex-row">
                <div>
                  <Identicon class="ident-icon" @click.native="copy(stash)"
                  :size="32"
                  :theme="'polkadot'"
                  :value="stash" />
                </div>
                <div v-if="!$isMobile()" class="align-self-center ml-2">{{stash}}</div>
                <div v-else class="align-self-center ml-2">{{stash.substr(0, 5) + '......' + stash.substr(stash.length - 5)}}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td>Total Rewards</td>
            <td>
              <div class="d-flex flex-row">
                <div class='total-rewards'>{{totalRewards.toFixed(4)}} {{coinName}}</div>
                <div><span class="md-caption era-caption">(From <i>{{startDate}}</i> to <i>{{endDate}}</i>)</span></div>
              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
    <div class='md-layout md-alignment-top md-gutter'>
      <div class='md-layout-item md-medium-size-55 md-medium-size-100 md-xsmall-size-100'>
        <div class="md-title stash-info-title pt-4 pb-4 pl-4 header-card-light">Era Rewards</div>
        <v-data-table
          :headers="eraRewardHeaders"
          :items="eraRewards"
          :items-per-page="10"
          :footer-props="{
            'items-per-page-options': itemsPerPageOptions,
          }"
          :dense=true
          :mobile-breakpoint=0
          class="elevation-2 era-reward-table mb-4 mt-4">
          <template v-slot:[`item.amount`]="{ item }">
              {{ item.amount > 0.0001? item.amount.toFixed(4): '~0.0001' }} {{coinName}}
          </template>
        </v-data-table>
      </div>
      <div class='md-layout-item md-medium-size-35 md-medium-size-100 md-xsmall-size-100 charts'>
        <reward-chart v-bind:eraRewards="eraRewards.slice().reverse()" v-bind:series="'weekly'" v-bind:coinName="coinName"/>
      </div>
    </div>
    <div class="md-title stash-info-title pt-4 pb-4 pl-4 header-card-light">Nominated Validators</div>
      <div class='card-container' v-for="(validator, index) in validators" :key="index">
        <validator-card v-bind:displayName="validator.identity.display || validator.id" v-bind:activeKSM="validator.activeKSM || 0"
        v-bind:allKSM="validator.inactiveKSM || 0"
        v-bind:stash="validator.id"
        v-bind:nominators="validator.info.nominators"
        v-bind:commission="validator.info.commission"
        v-bind:isLoading="validator.isLoading"
        v-bind:favorite.sync="validator.isMissing"
        v-bind:apy="validator.info.apy"
        v-bind:commissionChange="commissionChange(validator)"
        v-bind:stalePayouts="validator.info.unclaimed_eras.length >= 20"
        v-bind:coinName="coinName"/>
    </div>
  </div>
  <div v-else-if="walletAddresses.length > 0">

  </div>
  <div v-else>
    <md-empty-state class="empty-state-view"
    md-rounded
    md-icon="search"
    md-label="Enter a stash ID to see its staking rewards"
    md-description="">
  </md-empty-state>
  <md-snackbar :md-duration="Infinity" :md-active.sync="showSnakeBar" md-persistent>
      <span>Cannot find staking rewards for {{selectedStash}}</span>
      <md-button class="md-accent" @click="showSnackbar = false">OK</md-button>
  </md-snackbar>
  </div>
</div>
</template>

<script>
const Yaohsin = require('../../scripts/yaohsin');
import Identicon from '@polkadot/vue-identicon';
import moment from 'moment';
import RewardChart from './rewardChart.vue';
import ValidatorCard from '../validatorTools/ValidatorCard';
import { EventBus } from '../../main';
const constants = require('../../scripts/constants');
export default {
  name: 'RewardQuerier',
  mounted: function() {
    EventBus.$on('walletAddressChanged', (address)=>{
      this.selectedStash = address;
    })
    const address = localStorage.getItem('walletAddress');
    if(address !== null) {
      this.selectedStash = address;
    }
    if(localStorage.getItem(this.localStorageKey) !== undefined && localStorage.getItem(this.localStorageKey) !== null) {
      let storage = JSON.parse(localStorage.getItem(this.localStorageKey));
      if(!Array.isArray(storage)) {
        storage = [storage];
      }
      const queriedStashes = storage.reduce((acc, stash)=>{
        if(!acc.find(element => element === stash)) {
          acc.push(stash);
        }
        return acc;
      }, []);
      localStorage.setItem(this.localStorageKey, JSON.stringify(queriedStashes));
      this.historicalQuery = JSON.parse(localStorage.getItem(this.localStorageKey));
    }
  },
  data: function() {
    return {
      coinName: '',
      yaohsin: new Yaohsin(),
      selectedStash: '',
      isStashValid: false,
      stash: '',
      totalRewards: 0,
      startDate: 0,
      endDate: 0,
      inDelay: false,
      historicalQuery: [],
      showSnakeBar: false,
      eraRewards: [],
      localStorageKey: 'queriedStashes',
      validators: [],
      isLoading: false,

      itemsPerPageOptions: [10, 20, 50, -1],
      eraRewardHeaders: [
        {
          text: 'Era',
          value: 'era',
        },
        { text: 'Payout Date', value: 'date' },
        { text: 'Amount', value: 'amount' },
      ],

      walletAddresses: [],
    }
  },
  methods: {
    copy: function(nominator) {
      this.$copyText(nominator);
    },
    saveQueriedRecords(stash) {
      const queriedStrings = localStorage.getItem(this.localStorageKey);
      let queried;
      if(queriedStrings === undefined || queriedStrings === null) {
        queried = [];
      } else {
        try {
          queried = JSON.parse(queriedStrings);
        } catch {
         queried = []; 
        }
      }
      if(!Array.isArray(queried)) {
        queried = [queried];
      }
      queried.push(stash);
      if(queried.length > 10) {
        queried = queried.shift();
      }
      localStorage.setItem(this.localStorageKey, JSON.stringify(queried));
    },
    calcTotalRewards(eraRewards) {
      this.startDate = 0;
      this.endDate = 0;
      this.totalRewards = eraRewards.eraRewards.reduce((acc, era)=>{
        acc += era.amount;
        return acc;
      }, 0);

      eraRewards.eraRewards.map((reward)=>{
        if(reward.timestamp < this.startDate || this.startDate === 0) {
          this.startDate = reward.timestamp;
        }
        if(reward.timestamp > this.endDate || this.endDate === 0) {
          this.endDate = reward.timestamp;
        }
      });
      this.startDate = moment(this.startDate).format('L');
      this.endDate = moment(this.endDate).format('L');
    },
    mergeEraRewards(eraRewards) {
      const _eraRewards = {};
      eraRewards.map((reward)=>{
        if(_eraRewards[reward.era] === undefined){
          _eraRewards[reward.era] = {
            amount: reward.amount,
            timestamp: reward.timestamp,
          }
        } else {
          _eraRewards[reward.era].amount += reward.amount;
        }
      });
      let result = [];
      Object.keys(_eraRewards).map((era)=>{
        result.push({
          era: era,
          amount: _eraRewards[era].amount,
          date: moment(_eraRewards[era].timestamp).format('L'),
        })
      });
      result.reverse();
      return result;
    },
    commissionChange: function(validator) {
      if(validator.statusChange !== undefined) {
        return validator.statusChange.commission;
      }
      return 0;
    }
  },
  watch: {
    selectedStash: async function(stash) {
      if(stash.length < 32) {
        return;
      }
      if(this.inDelay) return;
      this.inDelay = true;
      setTimeout(()=>{
        this.inDelay = false;
      }, 1000);
      this.isLoading = true;
      this.showSnakeBar = false;
      if(stash.startsWith('1')) {
        this.coinName = 'DOT';
      } else if(stash.charCodeAt(0) >= 65 && stash.charCodeAt(0) <= 90) {
        this.coinName = 'KSM';
      }
      const eraRewards = await this.yaohsin.getStashRewards(stash, {coin: this.coinName});
      if(eraRewards !== undefined) {
        this.isStashValid = true;
        this.saveQueriedRecords(stash);
        this.calcTotalRewards(eraRewards);
        this.eraRewards = this.mergeEraRewards(eraRewards.eraRewards);
        this.stash = eraRewards.stash;
      } else {
        this.showSnakeBar = true;
        this.isStashValid = false;
      }
      this.validators = await this.yaohsin.getNominatedValidators(stash, {coin: this.coinName});
      for(let i = 0; i < this.validators.length; i++) {
        const v = this.validators[i];
        v.activeKSM = parseInt(v.info.exposure.total) / (this.coinName === 'DOT'? constants.POLKADOT_DECIMAL: constants.KUSAMA_DECIMAL);
        v.inactiveKSM = v.info.nominators.reduce((acc, v_)=>{
          acc += (parseInt(v_.balance.lockedBalance) / (this.coinName === 'DOT'? constants.POLKADOT_DECIMAL: constants.KUSAMA_DECIMAL));
          return acc;
        }, 0);
      }
      this.isLoading = false;
    }
  },
  components: {
    Identicon,
    RewardChart,
    ValidatorCard,
  },
}
</script>
    RewardChart

<style lang="scss" scoped>
.card-container {
    width: 8%;
    min-width: 250px;
    margin-top: 12px;
    margin-bottom: 10px;
    position: relative;
    display: inline-block;
    background-color:#404b55;
    vertical-align: top;
  }
.stash-info-title {
  text-align: left;
}
#reward-querier {
  min-height: 88vh;
  background-color: #fafafa;
}
.charts {
  padding-top: 32px;
}

.era-reward-table {
  min-width: 60vw;
}

.empty-state-view {
  position: absolute;
  top: 50%;
  left: 50%;
  -moz-transform: translateX(-50%) translateY(-50%);
  -webkit-transform: translateX(-50%) translateY(-50%);
  transform: translateX(-50%) translateY(-50%);
}
.search-bar {
  max-width: 600px;
  height: 40px;
  vertical-align: middle;
}
.ident-icon {
  display: inline-block;
  cursor: copy;
}
#validator-id {
  display: inline-block;
  font-size: 10px;
  vertical-align: super;
  padding-left: 8px;
}
.era-caption {
  padding-left: 12px;
  display: inline-block;
}
.total-reward {
  display: inline-block;
}

  ::v-deep tbody tr:nth-of-type(even) {
    background-color: #e1e2e3;
  }

  ::v-deep tbody tr:nth-of-type(odd) {
    background-color: #fafafa;
  }

  ::v-deep .v-data-table-header {
    background-color: #e1e2e3;

  }

  ::v-deep .v-data-footer {
    background-color: #fafafa;
  }
  .header-card {
  background-color:#293031;
  color: #fafafa;
  }
  .header-card-light {
    background-color:#61ba89;
    color: #fafafa;
  }
</style>