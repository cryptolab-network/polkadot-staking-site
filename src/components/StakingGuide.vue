 
  <template>
  <div id="staking-guide">
    <md-dialog :md-active.sync="showDialog" @md-closed="onClose"  class="staking-guide">
      <md-dialog-title>Staking on Kusama</md-dialog-title>
      <md-dialog-content>
      <div v-if="$isMobile()">
        <div class="md-body-1 desc">
          Search for the validator on <a href="https://polkadot.js.org/apps/#/staking/waiting">Polkadot App</a> and nominate them.
        </div>
          <table id="kusama-table">
            <tr>
              <td class="ident-icon-column"><Identicon @click.native="copy('H4EeouHL5LawTqq2itu6auF62hDRX2LEBYk1TxS6QMrn9Hg')" class="ident-icon"
              :size="32"
              :theme="'polkadot'"
              :value="'H4EeouHL5LawTqq2itu6auF62hDRX2LEBYk1TxS6QMrn9Hg'"/></td>
              <td>DRAGONLANCE</td>
              <td>H4EeouHL5LawTqq2itu6auF62hDRX2LEBYk1TxS6QMrn9Hg</td>
            </tr>
            <tr>
              <td class="ident-icon-column"><Identicon @click.native="copy('HRfhckygfiHkqVW19e71R2pXNbR6om7138sLAJENt2Tw1HF')" class="ident-icon"
              :size="32"
              :theme="'polkadot'"
              :value="'HRfhckygfiHkqVW19e71R2pXNbR6om7138sLAJENt2Tw1HF'"/></td>
              <td>KRYNN</td>
              <td>HRfhckygfiHkqVW19e71R2pXNbR6om7138sLAJENt2Tw1HF</td>
            </tr>
            <tr>
              <td class="ident-icon-column"><Identicon @click.native="copy('GCNeCFUCEjcJ8XQxJe1QuExpS61MavucrnEAVpcngWBYsP2')" class="ident-icon"
              :size="32"
              :theme="'polkadot'"
              :value="'GCNeCFUCEjcJ8XQxJe1QuExpS61MavucrnEAVpcngWBYsP2'"/></td>
              <td>TAIWAN 001</td>
              <td>GCNeCFUCEjcJ8XQxJe1QuExpS61MavucrnEAVpcngWBYsP2</td>
            </tr>
            <tr>
              <td class="ident-icon-column"><Identicon @click.native="copy('CjU6xRgu5f9utpaCbYHBWZGxZPrpgUPSSXqSQQG5mkH9LKM')" class="ident-icon"
              :size="32"
              :theme="'polkadot'"
              :value="'CjU6xRgu5f9utpaCbYHBWZGxZPrpgUPSSXqSQQG5mkH9LKM'"/></td>
              <td>HSINCHU</td>
              <td>CjU6xRgu5f9utpaCbYHBWZGxZPrpgUPSSXqSQQG5mkH9LKM</td>
            </tr>
            <tr>
              <td class="ident-icon-column"><Identicon @click.native="copy('EMrTktHLYSHAqpVH3f2KMMoLkZPMWjeQAZLpZTJ6KgNcXVr')" class="ident-icon"
              :size="32"
              :theme="'polkadot'"
              :value="'EMrTktHLYSHAqpVH3f2KMMoLkZPMWjeQAZLpZTJ6KgNcXVr'"/></td>
              <td>TAICHUNG</td>
              <td>EMrTktHLYSHAqpVH3f2KMMoLkZPMWjeQAZLpZTJ6KgNcXVr</td>
            </tr>
          </table>
           <md-dialog-actions>
            <md-button class="md-raised md-primary" @click="$emit('close-guide')">OK</md-button>
          </md-dialog-actions>
      </div>
      <div v-else>
      <md-steppers :md-active-step.sync="active" md-linear>
      
      <md-step id="first" md-label="A simple guide" :md-done.sync="first">
        <md-progress-bar md-mode="query" v-if="showProgressBar"></md-progress-bar>
        <div v-if="showProgressBar">
          <p>Loading Kusama validators...</p>
        </div>
        <div v-if="!showProgressBar">
          <p>Follow this steps, you earn KSM by delegating to validators, chosen from <a href="https://thousand-validators.kusama.network/">Kusama Thousand Validators Programme</a></p>
          <p>1. Allow Polkadot browser extension to interact with the website.</p>
          <p>2. Select how much funds you want to delegate to these validators</p>
          <p>3. Sign a batch of extrinsics to fulfill to transaction</p>
        </div>
      </md-step>

      <md-step id="second" md-label="Kusama 1KV validators" :md-done.sync="second"  class="md-scrollbar">
        <span>Your funds will be delegated to these validators, chosen from the <a href="https://thousand-validators.kusama.network/">Thousand Validators Programme</a></span>
        <md-list>
          <md-list-item class="validator-list-item" v-for="(validator, index) in validators.slice(0, 16)" :key="index" value="validator.addr">
            <span>
              <Identicon class="ident-icon" @click.native="copy(validator.addr)"
              :size="32"
              :theme="'polkadot'"
              :value="validator.addr"
              />
            </span>
            <span class="md-list-item-text">{{validator.displayName}}</span>
            <span class="md-list-validator-addr">{{validator.addr}}</span>
          </md-list-item>
        </md-list>
        <p></p>
      </md-step>

      <md-step id="third" md-label="Bond your Stake" :md-done.sync="third">
        <div v-if="hasExtension">
        <!-- Ask polkadot extension about the identity of the nominator and the amount of its free funds -->
          <label class="md-subheading">Your Kusama Accounts</label><br/>
          <!-- <md-field>
          <md-select v-model="selectedAddress" @change="onAddrChange($event)">
            <md-option v-for="account in accounts" :key="account.address" v-bind:value="account.address">{{account.address}}</md-option>
          </md-select>
          </md-field> -->
          <md-field>
          <md-select v-model="selectedAddress" @md-selected="onAddrChange">
            <md-option v-for="account in accounts" :key="account.address" v-bind:value="account.address">{{transformAddress(account.address)}}</md-option>
          </md-select>
          </md-field>
          <br/>
        <p class="md-subheading">Your free funds: {{freeFund}} KSM</p>
        Stake 
        <input type="range" v-model.number="stakeFund" :min="stakedFund" :max="maxFund" step="0.001"> {{ stakeFund }} KSM to us
        </div>
        <div v-if="!hasExtension">
          <md-icon style="color:#fc5c65">warning</md-icon>
          To stake Kusama with us, you must install the <a href="https://polkadot.js.org/extension/">Polkadot browser extension</a> first.
        </div>
      </md-step>

      <md-step id="fourth" md-label="See result" :md-done.sync="fourth">
        <md-progress-bar md-mode="query" v-if="showProgressBar"></md-progress-bar>
        <span>{{extrinsicStatus}}</span>
        <p v-if="extrinsicStatus === 'done!'">You can see the result in <a :href="polkascanUrl">polkascan.io/</a></p>
        <p v-if="extrinsicStatus === 'done!'">Happy staking!</p>
      </md-step>
    </md-steppers>
      <md-dialog-actions>
        <md-button id="kusama-stake-with-us-next" class="md-raised md-primary" @click="setDone(nextStep())" :disabled="(isLoading || ended) || (active === 'third' && stakeFund === 0)">Continue</md-button>
        <md-button id="kusama-stake-with-us-end" class="md-secondary" @click="$emit('close-guide')">Close</md-button>
      </md-dialog-actions>
      </div>
      </md-dialog-content>
    </md-dialog>
  </div>
</template>

<script>
import Identicon from '@polkadot/vue-identicon';
const kusamaRpc = require('../scripts/polkadot').kusamaRpc;
const constants = require('../scripts/constants');
export default {
  name: 'StakingGuide',
  props: {
    open: Boolean,
  },
  data: function() {
    return {
      showDialog: this.open,
      first: false,
      second: false,
      third: false,
      fourth: false,
      active: 'first',
      isLoading: false,
      validators: [],
      accounts: [],
      selectedAccount: undefined,
      selectedAddress: "",
      freeFund: 0,
      stakedFund: 0,
      stakeFund: 0,
      maxFund: 0,
      hasExtension: false,
      // step four
      showProgressBar: false,
      extrinsicStatus: "",
      blockHash: "",
      polkascanUrl: "",
      ended: false,
    }
  },
  created: async function() {
    this.isLoading = true;
    this.showProgressBar = true;
    try {
      this.validators = await kusamaRpc.retrieveValidators();
      this.isLoading = false;
      this.showProgressBar = false;
    } catch(err) {
      console.error('We cannot connect to the kusama json rpc');
    }
  },
  methods: {
    _calculateFunds(accountInfo) {
      console.log((accountInfo.data.free.toNumber() / constants.KUSAMA_DECIMAL).toFixed(3), (accountInfo.data.reserved.toNumber() / constants.KUSAMA_DECIMAL).toFixed(3),
      (accountInfo.data.feeFrozen.toNumber() / constants.KUSAMA_DECIMAL).toFixed(3), (accountInfo.data.miscFrozen.toNumber() / constants.KUSAMA_DECIMAL).toFixed(3));
          this.freeFund = ((accountInfo.data.free - accountInfo.data.feeFrozen) / constants.KUSAMA_DECIMAL).toFixed(3);
          this.stakedFund = (accountInfo.data.feeFrozen / constants.KUSAMA_DECIMAL).toFixed(3);
          this.stakeFund = this.stakedFund;
          this.maxFund = parseFloat(this.freeFund) + parseFloat(this.stakedFund); // minus 0.5 to make sure you have enough KSM to pay the fee
          if(this.maxFund < 0.5) {
            this.maxFund -= 0.2;
          } else {
            this.maxFund -= 0.5;
          }
    },
    async setDone (index) {
      if (index) {
        this.active = index
      }
      if (index === 'third') { // select a number of funds to bond
        this.accounts = await kusamaRpc.getAccountsFromExtension();
        if(this.accounts !== undefined) {
          this.hasExtension = true;
          this.selectedAddress = this.accounts[0].address;
          this.selectedAccount = this.accounts[0];
          const accountInfo = await kusamaRpc.getAccountInfo(this.selectedAddress);
          this._calculateFunds(accountInfo);
        } else {
          this.hasExtension = false;
        }
      }
      if (index === 'fourth') {
        this.ended = true;
        // call bond() or bondExtra()
        this.showProgressBar = true;
        console.log(this.transformAddress(this.selectedAddress));
        const tx = [];
        if(parseFloat(this.stakedFund) === 0) { // call bond()
          this.extrinsicStatus = "bonding..."
          try {
            tx.push(kusamaRpc.getBondExtrinsic(this.selectedAddress, this.stakeFund));
            //await kusamaRpc.bond(this.selectedAccount, this.selectedAccount.address, this.stakeFund);
          } catch(e) {
            this.extrinsicStatus = "failed to bond: " + e;
            this.showProgressBar = false;
            return;
          }
        } else if(parseFloat(this.stakeFund) - parseFloat(this.stakedFund) > 0) { // call bondExtra()
          this.extrinsicStatus = "bondingExtra..."
          try {
            tx.push(kusamaRpc.getBondExtraExtrinsic(parseFloat(this.stakeFund) - parseFloat(this.stakedFund)));
            //await kusamaRpc.bondExtra(this.selectedAccount, parseFloat(this.stakeFund) - parseFloat(this.stakedFund))
          } catch (e) {
            this.extrinsicStatus = "failed to bondExtra: " + e;
            this.showProgressBar = false;
            return;
          }
        }
        this.extrinsicStatus = "nominating..."
        // call nominate()
        try {
          tx.push(kusamaRpc.getNominateExtrinsic(this.validators.map((v)=>{
           return v.addr;
          })));
          //const blockHash = await kusamaRpc.nominate(this.selectedAccount, this.validators.map((v)=>{
          //  return v.addr;
          //}));
          console.log(this.selectedAccount);
          const blockHash = await kusamaRpc.batchSignAndSend(this.selectedAccount, tx);
          this.extrinsicStatus = "done!"
          this.blockHash = blockHash;
          await kusamaRpc.getBlockInfo(blockHash);
          this.showProgressBar = false;
          this.polkascanUrl = `https://polkascan.io/kusama/block/${blockHash}`;
        } catch(e) {
          this.extrinsicStatus = "failed to nominate: " + e;
          this.showProgressBar = false;
          return;
        }
      }
    },
    async onAddrChange () {
      if(this.selectedAddress !== undefined) {
        const accountInfo = await kusamaRpc.getAccountInfo(this.selectedAddress);
        this.selectedAccount = this.accounts.filter(account => account.address == this.selectedAddress);
        if(this.selectedAccount.length > 0) {
          this.selectedAccount = this.selectedAccount[0];
        }
        this._calculateFunds(accountInfo);
      }
    },
    nextStep () {
      switch(this.active) {
        case 'first':
          return 'second';
        case 'second':
          return 'third';
        case 'third':
          return 'fourth';
        case 'fourth':
          return 'fourth';
      }
    },
    transformAddress(addr) { 
      return kusamaRpc.transformAddressFromSubstrate(addr, 2);
    },
    onClose() {
      this.showDialog = false;
      this.$emit('close-guide');
    },
    copy: function(nominator) {
      this.$copyText(nominator);
    },
  },
  components: {
    Identicon
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  .md-list-item-text {
    font-size: 14px;
  }
  .md-list-validator-addr {
    font-size: 12px;
    text-align: right;
    color: gray;
  }
  .md-stepper-number{
    background-color: #0466C8 !important;
  }
  .validator-list-item {
    height: 36px;
  }
  .ident-icon {
    display: inline-block;
    cursor: copy;
  }
  .md-content {
    overflow: auto;
  }
  .desc {
    margin-bottom: 32px;
  }
</style>
