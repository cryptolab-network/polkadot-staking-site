<template>
  <div id="site-nav">
    <v-snackbar
      v-model="alertWalletConnectionFail"
    >
      Cannot connect to the Polkadot Extension. You must install
      <a href="https://polkadot.js.org/extension/" target="_blank">the extension</a>
      and allow CryptoLab to access it.
      <template v-slot:action="{ attrs }">
        <v-btn
          color="pink"
          text
          v-bind="attrs"
          @click="alertWalletConnectionFail = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <md-app md-mode="fixed" >
      <md-app-toolbar class="site-nav">
        <img v-if="currentRoute !== '/tools/ksmVN' && currentRoute !== '/tools/dotVN'" src="../assets/logo_small.png"/>
        <img v-if="currentRoute === '/tools/ksmVN'" src="../assets/logo_ksm_small.png"/>
        <img v-if="currentRoute === '/tools/dotVN'" src="../assets/logo_dot_small.png"/>
      <span class="md-title" @click="onClickTitle"><span style="color:#61ba89">Crypto</span><span style="color:#61ba89">Lab</span></span>
      <div class="md-toolbar-section-end">
        <v-chip style="padding-top:2px" color="#61ba89" v-if="!walletConnected && !$isMobile()">
          <v-switch inset text-color="#fafafa"  v-model="walletConnected">
            <template v-slot:label>
                <span class="connect-wallet">CONNECT WALLET</span>
            </template>
          </v-switch>
        </v-chip>

        <v-menu offset-y v-if="walletConnected && !$isMobile()">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="#61ba89"
              v-bind="attrs"
              v-on="on"
              v-if="selectedAddress === ''"
            >
              Select an account
            </v-btn>
            <v-btn v-bind="attrs"
              v-on="on" v-else class='d-flex flex-column rounded-5 mt-1 selected-account' style="align-items:end" height="44px">
              <div class="d-flex text-left">
                <Identicon class="ident-icon" @click.native="copy(selectedAccount.address)"
                :size="32"
                :theme="'polkadot'"
                :value="selectedAccount.address" />
                <div>
                  <span class="ml-4 account-card-dark">{{selectedAccount.meta.name}}</span>
                  <div class="ml-4" >{{selectedAccountFreeAmount}} {{coinName}} / {{selectedAccountBondedAmount}} {{coinName}}</div>
                </div>
                <v-icon
                  right
                  dark
                >
                  mdi-chevron-down
                </v-icon>
              </div>
            </v-btn>
          </template>
          <v-card class="ma-0" width="100%" outlined>
            <v-list style="border-color:#61ba89">
              <v-subheader class="connect-wallet" style="color:#293031a;height:24px ">
                ACCOUNTS
              </v-subheader>
              <v-divider style="color:#fafafa;"></v-divider>
              <v-list-item v-for="item in accounts" :key="item.address" style="border-color:#61ba89" @click="onAccountSelected(item)" >
                <v-btn class='d-flex flex-column rounded-5 mt-1' style="align-items:end" width="100%" height="44px">
                <div class="d-flex text-left">
                  <Identicon class="ident-icon" @click.native="copy(item.address)"
                  :size="32"
                  :theme="'polkadot'"
                  :value="item.address" />
                  <span class="ml-4 account-card-dark">{{item.meta.name}}</span>
                </div>
                </v-btn>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
        <md-button class="md-button nav-button" @click="onClickTool">
          Tools
        </md-button>
        <md-button class="md-button nav-button" @click="onClickStake">
          Stake with Us
        </md-button>
        <!-- <md-button class="md-button nav-button" href="https://www.yaohsin.net/blog">
          Blog
        </md-button> -->
        <md-button class="md-button nav-button" @click="onClickContact">
          Contact
        </md-button>
      </div>
      </md-app-toolbar>
    </md-app>
  </div>
</template>

<script>
/* global BigInt */
import Vue from 'vue'
import VueMeta from 'vue-meta'
import MetaInfo from 'vue-meta-info';
import { polkadotRpc, kusamaRpc } from '../scripts/polkadot';
import Identicon from '@polkadot/vue-identicon';
import constants from '../scripts/constants';
import divide from 'divide-bigint';
import { EventBus } from '../main';

// const constants = require('../scripts/constants');
Vue.use(MetaInfo);
Vue.use(VueMeta, {
  // optional pluginOptions
  refreshOnceOnNavigation: true
});
export default {
  name: 'SiteNav',
  metaInfo: {
    meta: [
      {
        name:'viewport', content: 'width=device-width, user-scalable=yes, initial-scale=1.0, maximum-scale=3.0, minimum-scale=1.0'
      }
    ]
  },
  data: function() {
    return {
      currentRoute: '/',
      walletConnected: false,
      selectedAddress: '',
      selectedAccount: {},
      selectedAccountFreeAmount: 0,
      selectedAccountBondedAmount: 0,
      accounts: [],
      coinName: 'KSM',
      alertWalletConnectionFail: false,
    };
  },
  methods: {
    onClickTool: function() {
      this.$router.push('/tools');
    },
    onClickStake: function() {
      this.$router.push('/');
    },
    onClickTitle: function() {
      this.$router.push('/');
    },
    onClickContact: function() {
      this.$router.push('/contact').catch(()=>{});
    },
    copy: function(nominator) {
      this.$copyText(nominator);
    },
    transformAddress(addr, type) {
      switch(type) {
        case 'KSM':
          return kusamaRpc.transformAddressFromSubstrate(addr, 2);
        case 'DOT':
          return polkadotRpc.transformAddressFromSubstrate(addr, 1);
      } 
    },
    async onAccountSelected(selectedAccount) {
      console.log(selectedAccount);
      this.selectedAddress = this.transformAddress(selectedAccount.address, this.coinName);
      this.selectedAccount = selectedAccount;
      if(this.coinName === 'KSM') {
        const accountInfo = await kusamaRpc.getAccountInfo(this.selectedAddress);
        const sum = BigInt(accountInfo.data.free) +
            BigInt(accountInfo.data.reserved);
        console.log(this.selectedAddress);
        this.selectedAccountFreeAmount = divide(sum, constants.KUSAMA_DECIMAL).toFixed(3);
        this.selectedAccountBondedAmount = divide(accountInfo.data.miscFrozen, constants.KUSAMA_DECIMAL).toFixed(3);
      } else {
        const accountInfo = await polkadotRpc.getAccountInfo(this.selectedAddress);
        const sum = BigInt(accountInfo.data.free) +
            BigInt(accountInfo.data.reserved);
        console.log(this.selectedAddress);
        this.selectedAccountFreeAmount = divide(sum, constants.POLKADOT_DECIMAL).toFixed(3);
        this.selectedAccountBondedAmount = divide(accountInfo.data.miscFrozen, constants.POLKADOT_DECIMAL).toFixed(3);
      }
      localStorage.setItem('walletAddress', this.selectedAddress);
      EventBus.$emit('walletAddressChanged', this.selectedAddress);
    },
    writeAccountsToLocalStorage() {
      localStorage.removeItem('extensionAccounts');
      const addresses = [];
      this.accounts.forEach((account)=>{
        addresses.push(account.address);
      });
      localStorage.setItem('extensionAccounts', addresses);
    },
    async getAccountsFromExtension(rpc) {
      this.accounts = await rpc.getAccountsFromExtension();
      if(this.accounts !== undefined && this.accounts.length > 0) {
        this.walletConnected = true;
        this.writeAccountsToLocalStorage();
        this.onAccountSelected(this.accounts[0]);
      } else {
        this.walletConnected = false;
        localStorage.removeItem('walletAddress');
      }
    }
  },
  mounted: async function() {
    await kusamaRpc.connect();
    await polkadotRpc.connect();
    await this.getAccountsFromExtension(kusamaRpc);
    EventBus.$on('coinNameChanged', (coinName)=>{
      if(coinName === 'DOT') {
        this.coinName = 'DOT';
        this.getAccountsFromExtension(polkadotRpc);
      } else {
        this.coinName = 'KSM';
        this.getAccountsFromExtension(kusamaRpc);
      }
    })
  },
  watch:{
    $route (to){
      this.currentRoute = to.path;
    },
    async walletConnected (status) {
      if(status) {
        this.accounts = await kusamaRpc.getAccountsFromExtension();
        if(this.accounts !== undefined) {
          this.writeAccountsToLocalStorage();
          this.onAccountSelected(this.accounts[0]);
        } else {
          this.walletConnected = false;
          localStorage.removeItem('walletAddress');
          this.alertWalletConnectionFail = true;
        }
      }
    },
  },
  components: {
    Identicon,
  }, 
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .site-nav {
    background-color: #1f232c !important;
  }

  .md-title {
    cursor: pointer;
  }

  .nav-button {
    color: #FFFFFF !important;
  }

  .account-card-dark {
    color: #fafafa;
  }

  .connect-wallet {
    font-family: 'Roboto';
    font-weight: 500;
    font-size:14px !important;
    letter-spacing: 1.25px;
  }

  ::v-deep .theme--light.v-divider {
    border-color: #61ba89;
  }

  ::v-deep .v-btn--outlined {
    border-color: #61ba89;
  }
  ::v-deep .v-menu__content{
    border-color: #61ba89;
  }

  ::v-deep .theme--light.v-btn.v-btn--has-bg{
    background-color: #61ba89;
  }

</style>
