<template>
  <div id="oneKValidator">
    <md-progress-bar md-mode="query" v-if="showProgressBar"></md-progress-bar>
    <p v-if="showProgressBar">Loading 1kv status...</p>
    <p v-if="isError">Fetching data from our server is failed. Please try again later</p>
    <div v-if="readyToDisplay && !isError">
      <v-card class="pt-2 mb-4 elevation-2 header-card">
        
        <div class="pb-2"><img v-if="coin==='KSM'" src="../../assets/1kv-logo.png" style="height:64px"/></div>
        <div class="d-flex header-card justify-center">
        <div class="heading-6 ma-2 mb-2"><span style="color:#61ba89" class="mr-2">Valid validators: </span>{{oneKVStatus.length}}</div>
        <!--<p>Total nominators: {{currentNominatingStatus.nominators.length}}</p>-->
        <div class="heading-6 ma-2 mb-2"><span style="color:#61ba89" class="mr-2">Active validators: </span>{{totalNominatedCount}}</div>
        <div class="heading-6 ma-2 mb-2"><span style="color:#61ba89" class="mr-2">1KV Nominators: </span>{{totalOneKvNominatorCount}}</div>
        <div class="heading-6 ma-2 mb-2"><span style="color:#61ba89" class="mr-2">1KV elected validators: </span>{{totalOneKvNominatedCount}}</div>
        </div>
      </v-card>
      <v-data-table
        :headers="eraRewardHeaders"
        :items="oneKVStatus"
        :items-per-page="50"
        :footer-props="{
          'items-per-page-options': itemsPerPageOptions,
        }"
        :search="search"
        class="elevation-2 era-reward-table mb-4">
        <template v-slot:top>
          <div class="d-flex align-center justify-start">
            <v-text-field
              v-model="search"
              label="Search for Validator Name"
              style="min-width: 400px;max-width:600px"
              class="pl-2"
            ></v-text-field>
            <!-- <v-chip class="ml-4" @click="onClickActiveOnly" v-bind:class="{ 'v-chip-active': activeOnly }">
              Active Only
            </v-chip>
            <v-chip class="ml-4" @click="onClick1kvNominatedOnly" v-bind:class="{ 'v-chip-active': oneKvNominatedOnly}">
              1KV Nominated Only
            </v-chip> -->
          </div>
        </template>
        <template v-slot:[`item.dashboard`]="{ item }">
          <md-button @click="onClickAnalytic(item.stash)"><md-icon>analytics</md-icon></md-button>
        </template>
        <template v-slot:[`item.commission`]="{ item }">
          {{ item.commissionZero? 0 : (item.commission / 10000000).toFixed(1) }} %
        </template>
        <template v-slot:[`item.elected`]="{ item }">
          <md-icon v-if="item.elected === true" class="nominated">check</md-icon>
          <md-icon v-if="item.elected === false" class="waiting">close</md-icon>
        </template>
        <template v-slot:[`item.oneKVNominated`]="{ item }">
          <md-icon v-if="item.oneKVNominated === true" class="nominated onekv-nominated-cell">check</md-icon>
          <div v-if="item.oneKVNominated === true" class="onekv-nominated-cell">({{item.nominatedFor}})</div>
          <md-icon v-if="item.oneKVNominated === false" class="waiting">close</md-icon>
          <div v-if="item.oneKVNominated === false" class="onekv-nominated-cell">({{item.nominatedAt}})</div>
        </template>
        <template v-slot:[`item.electedRate`]="{ item }">
          {{ Number.parseFloat(item.electedRate * 100).toFixed(2) }} %
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script>
const Yaohsin = require('../../scripts/yaohsin');
// const constants = require('../scripts/constants');
export default {
  name: 'oneKValidator',
  props: {
    coin: String,
  },
  data: function() {
    return {
      oneKVStatus: [],
      showProgressBar: false,
      readyToDisplay: false,
      currentNominatingStatus: [],
      totalNominatedCount: 0,
      totalElectedNominatorCount: 0,
      totalOneKvNominatedCount: 0,
      totalOneKvNominatorCount: 0,
      isError: false,

      activeOnly: false,
      oneKvNominatedOnly: false,
      search: '',
      itemsPerPageOptions: [10, 50, 100, -1],
      eraRewardHeaders: [
        {
          text: 'Validator Dashboard', value: 'dashboard'
        },
        { text: 'Name', value: 'name', align: 'center'},
        { text: 'Commission', value: 'commission', align: 'right'},
        { text: 'Active', value: 'elected', align: 'center'},
        { text: '1KV Nominated (Nominated For)', value: 'oneKVNominated', align: 'center'},
        { text: 'Nomination Order', value: 'order', align: 'right' },
        { text: 'Total Nominators', value: 'totalNominators', align: 'right d-none d-lg-table-cell' },
        { text: 'Active Nominators', value: 'activeNominators', align: 'right d-none d-lg-table-cell' },
        // { text: 'Last Nominated', value: 'nominatedAt', align: 'right d-none d-lg-table-cell'},
        { text: 'Rank', value: 'rank', align: 'right d-none d-lg-table-cell' },
        { text: 'Elected Rate', value: 'electedRate', align: 'right' },
      ],
    }
  },
  mounted: async function() {
    this.yaohsin = new Yaohsin();
    this.showProgressBar = true;
    const result = await this.yaohsin.getOneKVInfo(this.coin).catch(()=>{
      this.isError = true;
    });
    if(this.isError) {
      this.showProgressBar = false;
      return;
    }
    const oneKVOfficial = await this.yaohsin.getOneKVOfficialNominators(this.coin);
    const oneKVNominators = oneKVOfficial.nominators;
    this.totalOneKvNominatorCount = oneKVNominators.length;
    this.totalValidatorCount = result.valid.length;
    this.totalNominatedCount = result.electedCount;
    this.oneKVStatus = result.valid;
    this.yaohsin.getOneKVDetailedInfo(this.coin).then((detail)=>{
      this.oneKVStatus = this.yaohsin.mergeOneKVList(this.oneKVStatus, detail.valid, oneKVNominators);
      this.oneKVStatus.map((v)=>{
        if(v.commission < 1) {
          v.commissionZero === true;
        }
        if(v.oneKVNominated) {
          this.totalOneKvNominatedCount++;
        }
      });
      this.sortByNominationOrder();
      this.$forceUpdate();
      this.showProgressBar = false;
    }).catch(()=>{
      this.isError = true;
    });
    if(this.isError) {
      this.showProgressBar = false;
      return;
    }
    this.readyToDisplay = true;
  },
  methods: {
    onClickActiveOnly: function() {
      if(this.activeOnly) {
        this.activeOnly = false;
      } else {
        this.activeOnly = true;
        this.oneKvNominatedOnly = false;

      }
    },
    onClick1kvNominatedOnly: function() {
      if(this.oneKvNominatedOnly) {
        this.oneKvNominatedOnly = false;
      } else {
        this.oneKvNominatedOnly = true;
        this.activeOnly = false;
      }
    },
    onClickAnalytic: function(stash) {
      console.log(stash);
      let routeData = this.$router.resolve({path: 'validatorStatus', query: {stash: stash, coin: this.coin}});
      window.open(routeData.href, '_blank');
    },
    sortByNominationOrder: function() {
      this.oneKVStatus.sort((a, b)=>{
        if(a.aggregate?.aggregate > b.aggregate?.aggregate) {
          return -1;
        } else if(a.aggregate?.aggregate < b.aggregate?.aggregate) {
          return 1;
        }
        return 0;
      });
      for(let i = 0; i < this.oneKVStatus.length; i++) {
        this.oneKVStatus[i].order = i + 1;
      }
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  tr:nth-child(even){
    background-color:#fafafa;
  }
  tr:nth-child(odd){
    background-color: #e7e7e7;
  }
  .stats {
    display: block;
    justify-content: flex-start;
    align-items: flex-start;
  }
  .onekvTable {
    width: 100vw;
  }
  .nominated {
    color: #4FC50B !important;
  }
  .waiting {
    color: #FF2D00 !important;
  }
  .onekv-nominated-cell {
    display: inline-block;
  }

  .header-card {
    background-color:#293031;
    color: #fafafa;
  }

  .header-card-light {
    background-color:#61ba89;
    color: #fafafa;
  }
  
  ::v-deep tbody tr:nth-of-type(even) {
    background-color: #fafafa;
  }

  ::v-deep tbody tr:nth-of-type(odd) {
    background-color: #e1e2e3;
  }

  ::v-deep .v-data-table-header {
    background-color: #fafafa;

  }

  ::v-deep .v-data-footer {
    background-color: #fafafa;
  }

  ::v-deep .theme--light.v-data-table thead tr th {
    color: #fafafa;
  }

  .v-chip-active {
    background-color: #61ba89 !important;
  }
</style>