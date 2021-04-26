<template>
  <div id="nominatingStatus">
    <v-snackbar
      v-model="showConnectWalletFirst"
    >
      Connect to Polkadot Wallet first to nominate selected validators
      <template v-slot:action="{ attrs }">
        <v-btn
          color="pink"
          text
          v-bind="attrs"
          @click="showConnectWalletFirst = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <v-snackbar
      v-model="showNominateExtrinsicsFail"
    >
      Extrinsics failed: Failed to call Extrinsics<br>
      ({{nominateExtrinsicsFailedMsg}})
      <template v-slot:action="{ attrs }">
        <v-btn
          color="pink"
          text
          v-bind="attrs"
          @click="howNominateExtrinsicsFail = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <v-layout class="pt-8" v-if="showProgressBar" justify-center align-center>
      <v-progress-circular 
      indeterminate
      color=#61ba89
      v-if="showProgressBar">
      </v-progress-circular>
    </v-layout>
    
    <md-toolbar class="md-primary md-dense toolbar" v-if="showTooltips && !showProgressBar">
        <h4 class="md-dense" v-if="randomSeed < 0.7">
          Tips: Click on each card to see detailed information of the validator. Click <md-icon>favorite</md-icon> to put your interested validators to the top
        </h4>
        <h4 class="md-dense" v-if="randomSeed >= 0.7">
          Tips: Support us by nominating "Cryptolab.Network" on Polkadot App
        </h4>
        <div class="md-toolbar-section-end md-dense">
          <md-button class="md-icon-button" @click="onClickCloseTooltips">
            <md-icon>close</md-icon>
          </md-button>
        </div>
    </md-toolbar>
    <md-toolbar v-if="!showProgressBar && !isError">
      <div class="md-toolbar-row">
      <div class='md-toolbar-section-start search-bar '> 
        <md-icon id="search-icon">search</md-icon>
        <md-autocomplete md-input-placeholder="Search validators or nominators"
        v-model="selectedStash" :md-options="stashes" @md-changed="getStashes" @md-selected="onSearchSelected" @keydown.enter.native="onSearchSelected" @focusout.native="onSearchSelected"/>
      </div>
      <div class="md-toolbar-section-end">
        <md-button v-if="showNominateButton" class="md-icon-button" @click="onClickNominate">
          <md-icon>how_to_vote</md-icon>
        </md-button>
        <md-button class="md-icon-button" @click="onClickAnalytics">
          <md-icon>analytics</md-icon>
        </md-button>
        <md-button class="md-icon-button" @click="onClickSorting">
          <md-icon >sort</md-icon>
        </md-button>
        <md-button class="md-icon-button" v-if="!showTooltips" @click="onClickShowTooltips"><md-icon>info</md-icon></md-button>
      </div>
      </div>
    </md-toolbar>
    <p v-if="showProgressBar">Loading validator and nominator status...</p>
    <p v-if="isError">Fetching data from our server is failed. The site is probably syncing new era data. Please try again later</p>
    <v-pagination v-if="!showProgressBar && !isError"
      v-model="page"
      :length="Math.ceil((displayValidators.length / 100))"
      class="my-4 mb-n1"
      circle
      :total-visible="7"
    ></v-pagination>
    <div class='card-container' v-for="(validator, index) in displayValidators.slice((page - 1) * 100, (page) * 100 - 1)" :key="index">
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
      v-bind:coinName="coin"
      @voted-clicked="onVotedClicked"
      @favorite-clicked="onFavoriteClicked"/>
    </div>
    <v-pagination v-if="!showProgressBar && !isError"
      v-model="page"
      :length="Math.ceil((displayValidators.length / 100))"
      class="my-4 mb-n1"
      circle
      :total-visible="7"
    ></v-pagination>
    <sort-option-dialog v-if="showSortOptions" v-bind:open="showSortOptions"  @close-sorting-option="showSortOptions = false" @sorting-option="onSortingOptionChanged"/>
    <analytics-dialog v-if="showAnalytics" v-bind:open="showAnalytics" v-bind:validators="validators" @close-guide="showAnalytics = false"/>
  </div>
</template>

<script>
const Yaohsin = require('../../scripts/yaohsin');
const Polkadot = require('../../scripts/polkadot');
const constants = require('../../scripts/constants');
import ValidatorCard from './ValidatorCard.vue';
import AnalyticsDialog from './AnalyticsDialog.vue';
import SortOptionDialog from './SortOptionDialog.vue';
export default {
  name: 'nominatingStatus',
  props: {
    coin: String,
  },
  data: function() {
    return {
      validators: [],
      nominators: [],
      stashes: [],
      selectedStash: '',
      displayValidators: [],
      showProgressBar: false,
      showAnalytics: false,
      showSortOptions: false,
      isError: false,
      showTooltips: true,
      randomSeed: Math.random(),

      votedValidators: [],
      showNominateButton: false,
      rpc: {},
      showConnectWalletFirst: false,
      showNominateExtrinsicsFail: false,
      nominateExtrinsicsFailedMsg: '',

      page: 1,
    }
  },
  mounted: async function() {
    this.showProgressBar = true;
    const yaohsin = new Yaohsin();
    this.rpc = new Polkadot(this.coin);
    await this.rpc.connect();
    let result = undefined;
    result = await yaohsin.getAllValidatorAndNominators({coin: this.coin}).catch(()=>{
        this.isError = true;
    });
    if(this.isError) {
      this.showProgressBar = false;
      return;
    }
    this.validators = result;
    for(let i = 0; i < this.validators.length; i++) {
    // this.validators.forEach((v)=>{
      const v = this.validators[i];
      v.isLoading = true;
      if(v.identity === undefined || v.identity === null) {
        v.identity = {
          display: v.id,
        };
      }
      if(v.identity.display === null) {
        v.identity = {
          display: v.id,
        };
      }
      v.activeKSM = parseInt(v.info.exposure.total) / (this.coin === 'DOT'? constants.POLKADOT_DECIMAL: constants.KUSAMA_DECIMAL);
      v.inactiveKSM = v.info.nominators.reduce((acc, v_)=>{
        acc += (parseInt(v_.balance.lockedBalance) / (this.coin === 'DOT'? constants.POLKADOT_DECIMAL: constants.KUSAMA_DECIMAL));
        return acc;
      }, 0);
      this.displayValidators.push(v);
      v.isLoading = false;
    }
    this.displayValidators = this.displayValidators.map(
      function(data, idx)
      {
        data.idx = idx;
        return data;
      }
    );
    this.sortById();
    this.sortByCommissionChange();
    this.sortByFavorite();
    this.showProgressBar = false;
    yaohsin.getAllNominators({coin: this.coin}).then((nominators)=>{
      this.nominators = nominators;
    });
  },
  methods: {
    getStashes: function(term) {
      this.stashes = new Promise((resolve)=>{
        const matched = [];
        this.validators.forEach((v)=>{
          if(v.identity !== undefined) {
            if(v.identity.display.toUpperCase().includes(term.toUpperCase())) {
              matched.push(v.identity.display);
            }
          }
        });
        resolve(matched);
      });
    },
    onClickNominate: async function() {
      const address = localStorage.getItem('walletAddress');
      if(address !== null) {
        const accounts = await this.rpc.getAccountsFromExtension();
        if(accounts.length === 0) {
          this.showConnectWalletFirst = true;
          return;
        }
        const index = accounts.findIndex((account)=>{
          return this.transformAddress(account.address, this.coin) === address;
        });
        if(index >= 0) {
          try {
            const blockHash = await this.rpc.nominate(accounts[index], this.votedValidators);
            // nominated
            console.log(blockHash);
          } catch(e) {
            this.showNominateExtrinsicsFail = true;
            this.nominateExtrinsicsFailedMsg = e.message;
            console.error(e.message);
          }
        }
      } else {
        this.showConnectWalletFirst = true;
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
    onVotedClicked: function(data) {
      console.log(data);
      if(data.voted === true) {
        this.votedValidators.push(data.stash);
      } else {
        const index = this.votedValidators.findIndex((v) => v === data.stash);
        if(index >= 0) {
          this.votedValidators.splice(index, 1);
        }
      }
    },
    onSearchClear: function() {
      console.log('sort all');
      this.displayValidators.splice(0, this.displayValidators.length);
      this.validators.forEach((v)=>{
        this.displayValidators.push(v);
      });
      this.sortById();
      this.sortByFavorite();
      this.displayValidators = this.displayValidators.map(
        function(data, idx)
        {
          data.idx = idx;
          return data;
        }
      );
      console.log('sort all ends');
    },
    onSearchSelected: function(stash) {
      stash = this.selectedStash;
      if(stash === '') {
        this.onSearchClear();
      } else {
        this.displayValidators.splice(0, this.displayValidators.length);
        this.validators.forEach((v)=>{
          if(v.identity.display.toUpperCase().includes(stash.toUpperCase())) {
            this.displayValidators.push(v);
          }
          if(v.id.toUpperCase() === stash.toUpperCase()) {
            this.displayValidators.push(v);
          }
        });
        if(this.displayValidators.length === 0) {
          console.log('search nominators');
          this.nominators.forEach((n)=>{
            if(n.accountId === stash) {
              // which is really slow here...
              this.validators.forEach((v)=>{
                n.targets.forEach((t)=>{
                  if(v.id.toUpperCase().includes(t.toUpperCase())) {
                    this.displayValidators.push(v);
                  }
                });
              });
            }
          });
          console.log('search nominators finished');
        }
      }
    },
    onClickAnalytics: function() {
      this.showAnalytics = true;
    },
    onClickSorting: function() {
      this.showSortOptions = true;
    },
    onFavoriteClicked: function() {
      if(this.selectedStash === '') {
        this.sortById();
        this.sortByFavorite();
      }
    },
    onClickCloseTooltips: function() {
      this.showTooltips = false;
    },
    onClickShowTooltips: function() {
      this.showTooltips = true;
    },
    onSortingOptionChanged: function(option) {
      const hightlights = option.highlights;
      if(hightlights.commissionHigh === true) {
        this.hideCommissionHigh();
      } else {
        this.displayValidators = this.validators;
      }
      const sortBy = option.sortBy;
      if(sortBy === 'alphabetical' || sortBy === 'default') {
        this.sortById();
      } else if(sortBy === 'apy'){
        this.sortByApy();
        this.displayValidators = this.displayValidators.map(
        function(data, idx)
        {
          data.idx = idx;
          return data;
        }
        );
      }
      
      if(hightlights.commissionChange === true) {
        this.sortByCommissionChange();
      }
      
      if(sortBy === 'default') {
        this.sortByFavorite();
      }
      this.displayValidators = this.displayValidators.map(
        function(data, idx)
        {
          data.idx = idx;
          return data;
        }
      );
    },
    sortByCommissionChange: function() {
      this.displayValidators = this.displayValidators.sort((a, b) => {
        if(a.statusChange.commission !== 0 && b.statusChange.commission === 0) {
          return -1;
        } else if (a.statusChange.commission === 0 && b.statusChange.commission !== 0) {
          return 1;
        }
        return a.idx - b.idx;
      });
    },
    sortByApy: function() {
      this.displayValidators = this.displayValidators.sort((a, b) => {
        if(a.info.apy > b.info.apy) {
          return -1;
        } else if(a.info.apy < b.info.apy) {
          return 1;
        }
        return a.idx - b.idx;
      });
    },
    sortById: function() {
      this.displayValidators = this.displayValidators.sort((a, b) => a.identity.display.localeCompare(b.identity.display));
    },
    sortByFavorite: function() {
      let item = localStorage.getItem(this.localStoragePath);
      if(item !== undefined) {
        if(item !== null) {
          const favoriteValidators = JSON.parse(item);
          this.displayValidators.forEach((v, idx)=>{
            if(favoriteValidators.includes(v.id)) {
              this.displayValidators.splice(idx, 1);
              this.displayValidators.unshift(v);
            }
          });
        }
      }
    },
    hideCommissionHigh: function() {
      this.displayValidators = this.displayValidators.filter(item => {
        if(item.info.commission <= 20) {
          return true;
        }
      });
    },
    commissionChange: function(validator) {
      if(validator.statusChange !== undefined) {
        return validator.statusChange.commission;
      }
      return 0;
    }
  },
  computed: {
    localStoragePath: function() {
      if(this.coin === 'KSM') {
        return 'ksm.validator.favorite';
      } else if(this.coin === 'DOT') {
        return 'dot.validator.favorite';
      }
      return '';
    }
  },
  watch: {
    votedValidators: function() {
      if(this.votedValidators.length > 0) {
        this.showNominateButton = true;
      } else {
        this.showNominateButton = false;
      }
    }
  },
  components: {
    ValidatorCard,
    AnalyticsDialog,
    SortOptionDialog,
  }
}
</script>

<!-- ,
    AnalyticsDialogAdd "scoped" attribute to limit CSS to this component only -->
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
.search-bar {
  max-width: 600px;
  height: 40px;
  vertical-align: middle;
}
#nominatingStatus {
  min-height: 88vh;
  background-color: #fafafa;
}
.toolbar {
  background-color: #61ba89 !important;
}
</style>