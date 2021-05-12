<template>
  <div id="nominatingStatus">
    <v-dialog
      v-model="showNominationDialog"
    >
      <nomination-dialog
        v-bind:rpc="rpc"
        v-bind:coinName="coin"
        v-bind:stash="walletAddress"
        v-bind:validators="votedValidators"
        @close="onNominationDialogClose()"
      />
    </v-dialog>
    
    <v-layout class="pt-8" v-if="showProgressBar" justify-center align-center>
      <v-progress-circular 
      indeterminate
      color=#61ba89
      v-if="showProgressBar">
      </v-progress-circular>
    </v-layout>
    
    <md-toolbar class="md-primary md-dense toolbar" v-if="showTooltips && !showProgressBar">
        <h4 class="md-dense" v-if="randomSeed < 0.3 && coin === 'KSM'">
          Tips: Click on each card to see detailed information of the validator. Click <md-icon>favorite</md-icon> to put your interested validators to the top
        </h4>
        <h4 class="md-dense" v-if="randomSeed >= 0.3 && randomSeed < 0.7 && coin === 'KSM'">
          Tips: Choose among validators by clicking <md-icon>how_to_vote</md-icon> to stake on Kusama Chain
        </h4>
        <h4 class="md-dense" v-if="randomSeed < 0.7 && coin === 'DOT'">
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
      v-bind:stalePayouts="validator.info.unclaimedEras.length >= 20"
      v-bind:coinName="coin"
      v-bind:showVote="true"
      v-bind:voted="votedValidators.find((v) => v.id === validator.id) !== undefined"
      v-bind:selfStash="validator.info.exposure.own"
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
const kusamaRpc = require('../../scripts/polkadot').kusamaRpc;
const constants = require('../../scripts/constants');
import ValidatorCard from './ValidatorCard.vue';
import AnalyticsDialog from './AnalyticsDialog.vue';
import SortOptionDialog from './SortOptionDialog.vue';
import NominationDialog from '../nomintorTools/nominationDialog.vue';

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
      showNominationDialog: false,
      rpc: {},
      page: 1,
      blockHash: '',

      walletAddress: '',
    }
  },
  mounted: async function() {
    this.showProgressBar = true;
    const yaohsin = new Yaohsin();
    this.rpc = kusamaRpc;
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
      v.first = false;
      if(v.identity.display.toUpperCase() === 'CRYPTOLAB.NETWORK') {
        v.first = true;
      }
      this.displayValidators.push(v);
      v.isLoading = false;
    }
    this.sortById();
    this.sortPriority();
    this.displayValidators = this.displayValidators.map(
      function(data, idx)
      {
        data.idx = idx;
        return data;
      }
    );
    this.sortByCommissionChange();
    this.sortByFavorite();
    this.showProgressBar = false;
    yaohsin.getAllNominators({coin: this.coin}).then((nominators)=>{
      this.nominators = nominators;
    });
  },
  methods: {
    onNominationDialogClose: function() {
      console.log('close nomination dialog');
      this.showNominationDialog = false;
    },
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
      this.showNominationDialog = true;
      this.walletAddress = localStorage.getItem('walletAddress');
    },
    onVotedClicked: function(data) {
      if(data.voted === true) {
        if(this.votedValidators.length >= 16) {
          return;
        }
        const v = this.validators.find((v)=> v.id === data.stash);
        this.votedValidators.push(v);
      } else {
        const index = this.votedValidators.findIndex((v) => v.id === data.stash);
        if(index >= 0) {
          this.votedValidators.splice(index, 1);
        }
      }
    },
    onSearchClear: function() {
      console.log('sort all');
      this.displayValidators.splice(0, this.displayValidators.length);
      this.validators.forEach((v)=>{
        v.first = false;
        if(v.identity.display.toUpperCase() === 'CRYPTOLAB.NETWORK') {
          v.first = true;
        }
        this.displayValidators.push(v);
      });
      this.sortById();
      this.sortPriority();
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
        this.sortPriority();
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
      if(sortBy === 'alphabetical') {
        this.sortById();
      } else if(sortBy === 'default') {
        this.sortById();
        this.sortPriority();
      }
        else if(sortBy === 'apy'){
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
      this.displayValidators = this.displayValidators.sort((a, b) => {
        return a.identity.display.localeCompare(b.identity.display);
      });
    },
    sortPriority: function() {
      this.displayValidators = this.displayValidators.sort((a, b) => {
        return a.first === true ? -1 : b.first === true ? 1 : 0;
      });
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
    NominationDialog,
  }
}
</script>

<!-- ,
    AnalyticsDialogAdd "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.card-container {
    width: 8%;
    min-width: 288px;
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