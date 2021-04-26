<template>
  <div id="validator-card">
    <md-card md-with-hover v-bind:id="stash" v-bind:class="{'inactive-validator': activeKSM === 0}" md-ratio="4:3">
    
      <md-card-header @click.native="onClickCard(stash)" >
        <div class="md-title">
          <Identicon @click.native="copy" class="ident-icon"
          :size="32"
          :theme="'polkadot'"
          :value="stash"
        /> {{shortenedDisplayName}} <md-icon v-if="stalePayouts" class="stale-payouts">
          <md-tooltip md-direction="bottom">More than 20 unclaimed payouts</md-tooltip>
          paid</md-icon>
        </div>
        <div>
          <div class="md-subhead small-font">{{activeKSM.toFixed(coinName === 'KSM'?3:0)}} {{coinName}} / 
            <span class="md-subhead small-font" v-if="!isLoading && allKSM !== undefined">{{allKSM.toFixed(coinName === 'KSM'?3:0)}} {{coinName}}</span>
          </div>
          <div class="md-subhead md-headline">APY: {{(apy * 100).toFixed(2)}}%</div>
          <div class="md-subhead" v-if="isLoading">Loading total nominated amount...</div>
        </div>
      </md-card-header>

      <md-card-content>
        <div @click="onClickCard(stash)" >
          Nominator Count: {{nominators.length}}<br>
          Commission: {{commission.toFixed(1)}}%
          <span v-if="this.commissionChange === 1"><md-icon style="color:#FF2D00">keyboard_arrow_up</md-icon></span>
          <span v-if="this.commissionChange === 2"><md-icon style="color:#4FC50B">keyboard_arrow_down</md-icon></span>
        </div>
        <md-card-actions>
          <md-card-media>
            <md-button v-if="coinName === 'KSM'" class="md-icon-button" @click="onClickVote(stash)">
              <md-icon v-bind:class="{'favorite': voted}">how_to_vote</md-icon>
            </md-button>
            <md-button class="md-icon-button" @click="onClickFavorite(stash)">
              <md-icon v-bind:class="{'favorite': favorite}">favorite</md-icon>
            </md-button>
          </md-card-media>
        </md-card-actions>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import Identicon from '@polkadot/vue-identicon';
export default {
  name: 'ValidatorCard',
  props: {
    displayName: String,
    activeKSM: Number,
    stash: String,
    nominators: Array,
    commission: Number,
    allKSM: Number,
    isLoading: Boolean,
    favorite: Boolean,

    apy: Number,
    commissionChange: Number,
    coinName: String,
    stalePayouts: Boolean,
  },
  data: function() {
    return {
      voted: false,
      votedValidators: [],
    };
  },
  computed: {
    shortenedDisplayName: function() {
      if(this.displayName.length > 36) {
        return this.displayName.substr(0, 5) + '......' + this.displayName.substr(this.displayName.length - 5)
      }
      return this.displayName;
    },
    localStoragePath: function() {
      if(this.coinName === 'KSM') {
        return 'ksm.validator.favorite';
      } else if(this.coinName === 'DOT') {
        return 'dot.validator.favorite';
      }
      return '';
    }
  },
  mounted: async function() {
     let item = localStorage.getItem(this.localStoragePath);
      let favoriteValidators = [];
      if(item !== undefined && item !== null) {
        favoriteValidators = JSON.parse(item);
      }
      const index = favoriteValidators.indexOf(this.stash);
      if(index >= 0) {
        this.$emit('update:favorite', true);
      }
      
  },
  methods: {
    copy: function(e) {
      this.$copyText(this.stash);
      e.stopPropagation();
    },
    onClickCard: function(stash) {
      console.log(stash, this.coinName);
      let routeData = this.$router.resolve({path: 'validatorStatus', query: {stash: stash, coin: this.coinName}});
      window.open(routeData.href, '_blank');
    },
    onClickVote: function() {
      if(!this.voted) {
        this.voted = true;
      } else {
        this.voted = false;
      }
      this.$emit('voted-clicked', {
        stash: this.stash,
        voted: this.voted});
    },
    onClickFavorite: function(stash) {
      try{
        if(!this.favorite) {
          let item = localStorage.getItem(this.localStoragePath);
          let favoriteValidators = [];
          if(item !== undefined && item !== null) {
            favoriteValidators = JSON.parse(item);
          }
          favoriteValidators.push(stash);
          localStorage.setItem(this.localStoragePath, JSON.stringify(favoriteValidators));
          this.$emit('update:favorite', true);
          this.$emit('favorite-clicked', true)
        } else {
          let item = localStorage.getItem(this.localStoragePath);
          let favoriteValidators = [];
          if(item !== undefined && item !== null) {
            favoriteValidators = JSON.parse(item);
          }
          const index = favoriteValidators.indexOf(stash);
          favoriteValidators.splice(index, 1);
          localStorage.setItem(this.localStoragePath, JSON.stringify(favoriteValidators));
          this.$emit('update:favorite', false);
          this.$emit('favorite-clicked', false)
        }
      } catch(err){
        console.error(err);
        localStorage.removeItem(this.localStoragePath);
      }
      
    }
  },
  components: {
    Identicon
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  .md-card {
    margin: 4px;
    min-height: 250px;
    max-height: 250px;
    vertical-align: top;
  }
  .md-title {
    font-size: 8px;
    word-break: break-all;
  }
  .inactive-validator {
    background-color: #bbbbbb;
  }
  .ident-icon {
    cursor: copy;
  }
  .favorite {
    color: darkorange !important;
  }
  .small-font {
    font-size: 10px;
  }

  .stale-payouts {
    color: #f07178 !important;
  }
</style>