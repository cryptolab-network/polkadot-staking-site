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
        <div class='md-toolbar-section-end'> 
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
                <div><span class='md-caption era-caption total-rewards ml-4'>~= {{totalInFiat.toFixed(4)}} {{ selectedCurrency }}</span></div>
                <div><span class="md-caption era-caption">(From <i>{{startDate}}</i> to <i>{{endDate}}</i>)</span></div>
              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
    <div class='md-layout md-alignment-top md-gutter'>
      <div class='md-layout-item md-medium-size-55 md-medium-size-100 md-xsmall-size-100'>
        <div class="md-title stash-info-title pt-4 pl-4 header-card-light" >
          <div class="md-layout pb-2">
            <div class="md-layout-item md-size-20 mt-1">Era Rewards</div>
            <div class="md-layout-item"></div>
            <md-menu class="md-layout-item md-size-5" md-direction="bottom-start">
            <md-button class="md-icon-button" md-menu-trigger>
              <md-icon style="color:#fafafa; cursor:pointer; text-align:right" class="header-card-light">file_download</md-icon>
            </md-button>
            <md-menu-content>
              <md-menu-item style="cursor:pointer">
                <download-csv
                  :data = "eraRewards">
                  Download Era Rewards
                </download-csv>
              </md-menu-item>
              <md-menu-item style="cursor:pointer" @click="onDownloadSrcCsv">
                Staking Rewards Collector CSV
              </md-menu-item>
              <md-menu-item style="cursor:pointer" @click="onDownloadSrcJson">
                Staking Rewards Collector JSON
              </md-menu-item>
            </md-menu-content>
          </md-menu>
          <md-button class="md-icon-button" @click="onClickFilter">
              <md-icon style="color:#fafafa;" id="search-icon">filter_alt</md-icon>
          </md-button>
          <md-dialog :md-active.sync="showFilter">
            <md-dialog-title>Preferences</md-dialog-title>
            <div class="d-flex flex-column ma-8">
                <template>
                      <v-menu
                        ref="menu"
                        v-model="menu"
                        :close-on-content-click="false"
                        :return-value.sync="startDateConfig"
                        transition="scale-transition"
                        offset-y
                        min-width="auto"
                      >
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field
                            class="date-picker"
                            v-model="startDateConfig"
                            label="Start Date"
                            prepend-icon="mdi-calendar"
                            readonly
                            v-bind="attrs"
                            v-on="on"
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          v-model="startDateConfig"
                          no-title
                          scrollable
                        >
                          <v-spacer></v-spacer>
                          <v-btn
                            text
                            color="#61ba89"
                            @click="menu = false"
                          >
                            Cancel
                          </v-btn>
                          <v-btn
                            text
                            color="#61ba89"
                            @click="onStartDateSelected(startDateConfig)"
                          >
                            OK
                          </v-btn>
                        </v-date-picker>
                      </v-menu>
                      <v-menu
                        ref="menu2"
                        v-model="menu2"
                        :close-on-content-click="false"
                        :return-value.sync="endDateConfig"
                        transition="scale-transition"
                        offset-y
                        min-width="auto"
                      >
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field
                            class="date-picker"
                            v-model="endDateConfig"
                            label="End Date"
                            prepend-icon="mdi-calendar"
                            readonly
                            v-bind="attrs"
                            v-on="on"
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          v-model="endDateConfig"
                          no-title
                          scrollable
                        >
                          <v-spacer></v-spacer>
                          <v-btn
                            text
                            @click="menu2 = false"
                          >
                            Cancel
                          </v-btn>
                          <v-btn
                            text
                            color="#61ba89"
                            @click="onEndDateSelected(endDateConfig)"
                          >
                            OK
                          </v-btn>
                        </v-date-picker>
                      </v-menu>
                </template>
                <template>
                  <v-select
                    class="date-picker"
                    prepend-icon="mdi-cash-multiple"
                    v-model="selectedCurrency"
                    :items="supportedCurrencies"
                    label="Currency"
                  ></v-select>
                </template>
                <v-text-field
                  class="date-picker"
                  prepend-icon="mdi-cash-multiple"
                  label="Start Balance"
                  v-model="startBalance"
                  :suffix="coinName"
                ></v-text-field>
            </div>
            <md-dialog-actions>
              <md-button class="" @click="showFilter = false">Cancel</md-button>
              <md-button style="color:#61ba89;" :disabled="invalidFilter" @click="onFilterSet">Save</md-button>
            </md-dialog-actions>
          </md-dialog>
          </div>
        </div>
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
              {{ item.amount > 0.0001? item.amount.toFixed(4): '0' }} {{coinName}}
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
        v-bind:stalePayouts="validator.info.unclaimedEras.length >= 20"
        v-bind:coinName="coinName"/>
    </div>
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
const constants = require('../../scripts/constants');
export default {
  name: 'RewardQuerier',
  mounted: function() {
    if(this.$route.params.stash !== undefined) {
      this.selectedStash = this.$route.params.stash;
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
      startDate:  moment('2020-01-01').format("YYYY-MM-DD"),
      endDate: moment().format("YYYY-MM-DD"),
      startDateConfig:  moment('2020-01-01').format("YYYY-MM-DD"),
      endDateConfig: moment().format("YYYY-MM-DD"),
      inDelay: false,
      historicalQuery: [],
      showSnakeBar: false,
      eraRewards: [],
      localStorageKey: 'queriedStashes',
      validators: [],
      isLoading: false,
      showFilter: false,
      invalidFilter: false,

      menu: "",
      menu2: "",
      startBalance: 0.1,
      selectedCurrency: 'USD',
      totalInFiat: 0.0,

      itemsPerPageOptions: [10, 20, 50, -1],
      eraRewardHeaders: [
        { text: 'Payout Date', value: 'date' },
        { text: 'Amount', value: 'amount' },
        { text: `Price (USD)`, value: 'price' },
        { text: `Total (USD)`, value: 'total'}
      ],

      supportedCurrencies: [
        "usd",
        "aed",
        "ars",
        "aud",
        "bdt",
        "bhd",
        "bmd",
        "brl",
        "cad",
        "chf",
        "clp",
        "cny",
        "czk",
        "dkk",
        "eur",
        "gbp",
        "hkd",
        "huf",
        "idr",
        "ils",
        "inr",
        "jpy",
        "krw",
        "kwd",
        "lkr",
        "mmk",
        "mxn",
        "myr",
        "ngn",
        "nok",
        "nzd",
        "php",
        "pkr",
        "pln",
        "rub",
        "sar",
        "sek",
        "sgd",
        "thb",
        "try",
        "twd",
        "uah",
        "vef",
        "vnd",
        "zar",
      ].map((c) => {
        return c.toUpperCase();
      }),
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
      this.startDate = moment(this.startDate).format('YYYY-MM-DD');
      this.endDate = moment(this.endDate).format('YYYY-MM-DD');
    },
    mergeEraRewards(eraRewards) {
      return eraRewards.map((era)=>{
        era.date = moment.utc(era.timestamp).format('L');
        era.total = era.total.toFixed(2);
        return era;
      });
    },
    commissionChange: function(validator) {
      if(validator.statusChange !== undefined) {
        return validator.statusChange.commission;
      }
      return 0;
    },
    onClickFilter: function() {
      this.showFilter = true;
    },
    onStartDateSelected: function(startDate) {
      if(moment(startDate).isAfter(moment())) {
        this.menu = false;
        this.invalidFilter = true;
        return;
      }
      if(moment(startDate).isAfter(moment(this.endDateConfig))) {
        this.menu = false;
        this.invalidFilter = true;
        return;
      } else {
        this.invalidFilter = false;
      }
      this.$refs['menu'].save(startDate);
    },
    onEndDateSelected: function(endDate) {
      if(moment(endDate).isAfter(moment())) {
        this.menu2 = false;
        this.invalidFilter = true;
        return;
      }
      if(moment(this.startDateConfig).isAfter(moment(endDate))) {
        this.menu2 = false;
        this.invalidFilter = true;
        return;
      } else {
        this.invalidFilter = false;
      }
      this.$refs['menu2'].save(endDate);
    },
    onFilterSet: function() {
      this.showFilter = false;
      if(this.stash.length > 0) {
        this.query(this.stash);
      }
    },
    query: async function(stash) {
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
      const eraRewards = await this.yaohsin.getStashRewardsCollector(stash, {coin: this.coinName, startDate: this.startDateConfig,
      endDate: this.endDateConfig, startBalance: this.startBalance, currency: this.selectedCurrency});
      if(eraRewards !== undefined) {
        this.isStashValid = true;
        this.saveQueriedRecords(stash);
        this.calcTotalRewards(eraRewards);
        this.eraRewards = this.mergeEraRewards(eraRewards.eraRewards);
        console.log(this.eraRewards);
        this.stash = eraRewards.stash;
        this.totalInFiat = eraRewards.totalInFiat;
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
      this.eraRewardHeaders = this.eraRewardHeaders.map((header)=>{
        if(header.text.startsWith("Price")) {
          header.text = `Price (${this.selectedCurrency})`;
        }
        else if(header.text.startsWith('Total')) {
          header.text = `Total (${this.selectedCurrency})`;
        }
        return header;
      });
      this.isLoading = false;
    },
    onDownloadSrcCsv: async function() {
      if(this.stash.startsWith('1')) {
        this.coinName = 'DOT';
      } else if(this.stash.charCodeAt(0) >= 65 && this.stash.charCodeAt(0) <= 90) {
        this.coinName = 'KSM';
      }
      await this.yaohsin.getStashRewardsCollectorCsv(this.stash, {coin: this.coinName});
    },
    onDownloadSrcJson: async function() {
      if(this.stash.startsWith('1')) {
        this.coinName = 'DOT';
      } else if(this.stash.charCodeAt(0) >= 65 && this.stash.charCodeAt(0) <= 90) {
        this.coinName = 'KSM';
      }
      await this.yaohsin.getStashRewardsCollectorJson(this.stash, {coin: this.coinName});
    },
  },
  watch: {
    selectedStash: async function(stash) {
      this.startDateConfig = moment('2020-01-01').format("YYYY-MM-DD");
      this.endDateConfig = moment().format("YYYY-MM-DD");
      await this.query(stash);
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

  .date-picker {
    margin-left: 16px !important;
    margin-right: 16px !important;
  }

  ::v-deep .v-select.v-input__control.v-input__slot {
    margin-left: 12px !important;
  }
</style>