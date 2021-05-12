<template>
  <div id="validatorStatus">
    <md-progress-bar md-mode="query" v-if="showProgressBar"></md-progress-bar>
    <p v-if="showProgressBar">Loading Nominator Info...</p>
    
    <div class="info-panel">
      <div class="d-flex flex-row info-text pt-4 pb-2 header-card-light">
        <Identicon class="ident-icon align-center ml-4" @click.native="copy(stash)"
              :size="32"
              :theme="'polkadot'"
              :value="stash"
        />
        <div class="ml-4 align-center title">{{this.displayName || this.stash}}</div>
        <!--<div class="d-none d-lg-flex ml-8 title" v-if="displayName !== stash">{{stash}}</div>-->
      </div>
        <md-divider/>
        <div class="d-sm-flex-column d-md-flex mb-4 mt-4 ">
          <v-card class='elevation-4 info-card'>
          <v-simple-table>
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">
                    
                  </th>
                  <th class="text-left">

                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: left">Total Nomination Amount</td>
                  <td>
                    <div class="d-flex flex-row">
                      {{inactiveKSM}} {{coinName}}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: left">Commission</td>
                  <td>
                    <div class="d-flex flex-row">
                      {{eraCommission.toFixed(1)}}%
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: left">Monthly APY (Active)</td>
                  <td>
                    <div class="d-flex flex-row">
                      {{monthlyApy.toFixed(2)}} %
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: left">Unclaimed Payout Eras</td>
                  <td>
                    <div class="d-flex flex-row">
                      {{unclaimedEraString}}
                    </div>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
          </v-card>
          <v-card class="ml-md-4 mt-sm-4">
            <apexchart id="nomination-trend" ref="nomination-trend" width="380px" type="line" :options="options" :series="series"></apexchart>
          </v-card>
          <v-card class="ml-md-4 mt-sm-4">
            <apexchart id="apy-trend" ref="apy-trend" width="380px" type="line" :options="apyOptions" :series="apySeries"></apexchart>
          </v-card>
        </div>
    </div>
    <div class="nominator-list">
      <div class="header-card-light elevation-2 pt-4 pb-4 pl-4"> <h3 class="md-title">Active Nominators</h3></div>
      <div class="nominator-block">
        <div class="nominator" v-for="(nominator, index) in activeNominators" :key="index">
          <Identicon class="ident-icon" @click.native="copy(nominator.address)"
              :size="32"
              :theme="'polkadot'"
              :value="nominator.address"
          />
          <div class="detail">
            <div class="stash-id">{{nominator.address.substr(0, 5)}}......{{nominator.address.substr(nominator.address.length - 5)}}</div>
            <div class="bonding" v-if="nominator.balance.lockedBalance !== null && nominator.balance.lockedBalance !== undefined">
              {{(nominator.balance.lockedBalance / decimal).toFixed(3)}} {{coinName}} / {{nominator.targetCount}}
            </div>
            <div class="bonding" v-if="nominator.balance.lockedBalance === null || nominator.balance.lockedBalance === undefined">
              ? {{coinName}}
            </div>
          </div>
        </div>
      </div>

      <div class="header-card elevation-2 mt-4 pt-4 pb-4 pl-4"> <h3 class="md-title">Inactive Nominators</h3></div>
      <div class="nominator-block">
        <div class="nominator" v-for="(nominator, index) in inactiveNominators" :key="index">
          <Identicon class="ident-icon" @click.native="copy(nominator.address)"
              :size="32"
              :theme="'polkadot'"
              :value="nominator.address"
          />
          <div class="detail">
            <div class="stash-id">{{nominator.address.substr(0, 5)}}......{{nominator.address.substr(nominator.address.length - 5)}}</div>
            <div class="bonding" v-if="nominator.balance.lockedBalance !== null && nominator.balance.lockedBalance !== undefined">
              {{(nominator.balance.lockedBalance / decimal).toFixed(3)}} {{coinName}} / {{nominator.targetCount}}
            </div>
            <div class="bonding" v-if="nominator.balance.lockedBalance === null || nominator.balance.lockedBalance === undefined">
              ? {{coinName}}
            </div>
          </div>
        </div>
      </div>
    </div>
    <nominator-dashboard v-if="showNominatorDashboard" v-bind:open="showNominatorDashboard"
    v-bind:validators="nominatedValidators"
    v-bind:nominator="selectedNominator"
    @close-guide="showNominatorDashboard = false"/>
  </div>
</template>

<script>
const Yaohsin = require('../../scripts/yaohsin');
const constants = require('../../scripts/constants');
import NominatorDashboard from './NominatorDashboardDialog';
import Identicon from '@polkadot/vue-identicon';
export default {
  name: 'validatorStatus',
  props: {
    coinName: String,
  },
  data: function() {
    return {
      nominatedValidators: [],
      selectedNominator: {},
      showNominatorDashboard: false,
      nominators: [],
      balances: [],
      displayName: '',
      showProgressBar: false,
      inactiveKSM: 0,
      stash: "",
      apyTrend: [],
      eraCommission: 0,
      activeNominators: [],
      inactiveNominators: [],
      unclaimedEras: [],
      unclaimedEraString: '',
      options: {
        chart: {
          id: 'vuechart-example'
        },
        xaxis: {
          categories: this.xaxisCatagory,
          trim: true,
          hideOverlappingLabels: true,
        },
        yaxis: [
          {
            min: 0,
            labels: {
              formatter: function(val) {
                return val.toFixed(0);
              }
            },
            title: {
              text: "Nominator Count",
              style: {
                color: '#6166BA',
              }
            },
            seriesName: 'Nominator Count'
          },
          {
            min: 0,
            show: false,
            seriesName: 'Nominator Count'
          },
          {
            opposite: true,
            min: 0,
            max: 100,
            title: {
              text: "Commission (%)",
              style: {
                color: '#BAB661',
              }
            },
            seriesName: 'Commission'
          }
        ]
      },
      series: [{
        name: 'Nominator Count',
        data: this.nominatorCounts,
        color: '#6166BA'
      }, {
        name: 'Nominated',
        data: this.exposures,
        color: '#61BA89'
      }, {
        name: 'Commission',
        data: this.commisions,
        color: '#BAB661'
      }],
      apyOptions: {
        chart: {
          id: 'vuechart-example'
        },
        xaxis: {
          categories: this.xaxisCatagory,
          trim: true,
          hideOverlappingLabels: true,
        },
        yaxis: [
          {
            min: 0,
            labels: {
              formatter: function(val) {
                return val.toFixed(1);
              }
            },
            title: {
              text: "APY(%)",
              style: {
                color: '#61BA89',
              }
            },
            seriesName: 'APY'
          },
        ]
      },
      apySeries: [{
        name: 'APY',
        data: this.apyTrend,
        color: '#61BA89',
      }]
    }
  },
  mounted: async function() {
    this.showProgressBar = true;
    this.yaohsin = new Yaohsin();
    this.stash = this.$route.query.stash;
    this.coinName = this.$route.query.coin;
    console.log(this.$route);
    const validatorHistory = await this.yaohsin.getValidatorStatus(this.stash, {coin: this.coinName});
    const unclaimedEras = await this.yaohsin.getValidatorUnclaimedEras(this.stash, {coin: this.coinName});
    this.unclaimedEras = unclaimedEras;
    this.unclaimedEraString = this.handleUnclaimedEraString(this.unclaimedEras);
    this.xaxisCatagory= [];
    this.exposures = [];
    this.nominatorCounts = [];
    this.commissions = [];
    this.apyTrend = [];
    this.monthlyApy = 0;
    this.monthlyApyCount = 0;
    const data = validatorHistory.data[0];
    if(data.identity !== undefined) {
      console.log(data.identity);
      if(data.identity.display !== null) {
        this.displayName = data.identity.display;
      }
    }
    const infoLength = data.info.length;
    data.info.forEach((eraData, i)=>{
      this.xaxisCatagory.push(eraData.era.toString());
      this.nominatorCounts.push(eraData.nominatorCount);
      if(eraData.nominators !== null) {
        this.nominators = eraData.nominators.sort((a, b)=>{
          if(a.balance.lockedBalance > b.balance.lockedBalance) {
            return -1;
          } else if(a.balance.lockedBalance < b.balance.lockedBalance) {
            return 1;
          }
          return 0;
        });
      }
      this.exposures.push(eraData.exposure.others.length);
      this.commissions.push(eraData.commission);
      this.apyTrend.push(eraData.apy * 100);
      if(this.coinName === 'KSM') {
        if(infoLength - i <= 120) { //recent 120 eras
          if(eraData.apy > 0) {
            this.monthlyApy += eraData.apy * 100;
            this.monthlyApyCount++;
          }
        }
      } else {
        if(infoLength - i <= 30) { //recent 30 eras
          if(eraData.apy > 0) {
            this.monthlyApy += eraData.apy * 100;
            this.monthlyApyCount++;
          }
        }
      }
    });
    if(this.coinName === 'KSM') {
      this.monthlyApy /= this.monthlyApyCount;
    } else {
      this.monthlyApy /= this.monthlyApyCount;
    }
    if(isNaN(this.monthlyApy)) {
      this.monthlyApy = 0;
    }
    const eraExposure = data.info[data.info.length - 1].exposure;
    this.eraCommission = this.commissions[this.commissions.length - 1];
    if(this.eraCommission < 0.0001) {
      this.eraCommission = 0;
    }
    this.updateSeriesLine();
    this.balances = this.nominators.map((nominator) => {
      return nominator.balance.lockedBalance;
    });
    const allNominators = await this.yaohsin.getAllNominators({coin: this.coinName});
    this.nominators.map((nominator) => {
      allNominators.forEach((n)=>{
        if(n.accountId === nominator.address) {
          nominator.targetCount = n.targets.length;
        }
      });
    });

    this.inactiveKSM = this.balances.reduce((acc, b)=>{
      if(b === null) {
        return acc;
      }
      if(this.coinName === 'KSM') {
        acc += parseFloat((parseFloat(b / constants.KUSAMA_DECIMAL)).toFixed(3));
      } else if(this.coinName === 'DOT') {
        acc += parseFloat((parseFloat(b / constants.POLKADOT_DECIMAL)).toFixed(3));
      }
      return acc;
    }, 0);
    this.inactiveKSM = this.inactiveKSM.toFixed(3);
    // use exposure to decide who is active
    if(eraExposure.others.length > 0) {
      eraExposure.others.forEach((activeNominator)=>{
        const filtered = this.nominators.filter((n)=>{
          let active = false;
          if(n.address === activeNominator.who) {
            active = true;
          }
          return active;
        });
        if(filtered.length > 0) {
          this.activeNominators.push(filtered[0]);
        }
      });
    }
    this.inactiveNominators = this.nominators.filter((n)=>{
      let active = false;
      this.activeNominators.forEach((a)=>{
        if(a.address === n.address) {
          active = true;
        }
      });
      return !active;
    });
    this.activeNominators = this.activeNominators.sort((a, b)=>{
      if(a.balance.lockedBalance > b.balance.lockedBalance) {
        return -1;
      } else if(a.balance.lockedBalance < b.balance.lockedBalance) {
        return 1;
      }
      return 0;
    });
    this.inactiveNominators = this.inactiveNominators.sort((a, b)=>{
      if(a.balance.lockedBalance > b.balance.lockedBalance) {
        return -1;
      } else if(a.balance.lockedBalance < b.balance.lockedBalance) {
        return 1;
      }
      return 0;
    });
    this.showProgressBar = false;
  },
  methods: {
    handleUnclaimedEraString(unclaimedEras) {
      if(unclaimedEras.length === 0) {
        return 'None';
      }
      let unclaimedEraString = unclaimedEras.toString();
      if(unclaimedEras.length > 10) {
        unclaimedEraString = unclaimedEras.slice(0, 10).toString() + ' and ' +
          (unclaimedEras.length - 10).toString() + ' eras more';
      }
      return unclaimedEraString;
    },
    updateSeriesLine() {
      this.$refs['nomination-trend'].updateSeries([{
        data: this.nominatorCounts
      }, {
        data: this.exposures
      }, {
        data: this.commissions
      }], false, true);
      this.options = {
        xaxis: {
          categories: this.xaxisCatagory
        }
      };
      this.$refs['apy-trend'].updateSeries([{
        data: this.apyTrend,
      }], false, true);
      this.apyOptions = {
        xaxis: {
          categories: this.xaxisCatagory,
          title: {
            text: 'Era'
          }
        }
      };
    },
    copy: function(nominator) {
      this.$copyText(nominator);
    },
    onClickNominatorId: function(nominator) {
      this.selectedNominator = nominator;
      let promise = Promise.resolve();
      nominator.targets.forEach((v)=>{
        promise = promise.then(()=>{
          return this.yaohsin.getValidatorStatusOfCurrentEra(v);
        });
      });
      promise.then(()=>{
        this.showNominatorDashboard = true;
      });
    }
  },
  computed: {
    decimal: function() {
      if(this.coinName === 'KSM') {
        return constants.KUSAMA_DECIMAL;
      } else if(this.coinName === 'DOT') {
        return constants.POLKADOT_DECIMAL;
      }
      return constants.KUSAMA_DECIMAL;
    }
  },
  components: {
    Identicon,
    NominatorDashboard
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>

.info-card {
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
.stash-info {
  margin-left: 16px;
}
#validatorStatus {
  min-height: 88vh;
  background-color: #fafafa;
}
.info-panel {
  background-color: #fafafa;
}
.nominator-list {
  text-align: left;
}
.info-text {
  vertical-align: center;
}
#nomination-trend {
  display: inline-block;
  padding-right: 30px;
}
.nominator {
  display: inline-block;
  text-align: left;
  overflow:auto;
  min-width: 150px;
}
.nominator-block {
    padding-top: 20px;
}
.ident-icon {
  display: inline-block;
  cursor: copy;
}
.bonding {
  color: #5f6368;
  font-size: 8px;
}
.detail {
  display: inline-block;
  font-size: 6px;
}
#validator-id {
  display: inline-block;
  font-size: 10px;
  vertical-align: super;
  padding-left: 8px;
}
#stash-name {
  padding-left: 24px;
  padding-bottom: 20px;
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
</style>