<template>
  <div id="landing-page">
    <!-- <img src="../assets/img/banner.jpg" />-->
    <div v-if="$isMobile()" class="main-desc md-display-1">Earn <span style="color:#61ba89">Crypto </span>Income<div class="secondary-desc">in a few steps</div></div>
    <div v-else class="main-desc md-display-4">Earn <span style="color:#61ba89">Crypto </span>Income<div class="secondary-desc">in a few steps</div></div>
    <coin-cards/>
  </div>

</template>

<script>

import CoinCards from './CoinCards.vue'
export default {
  name: 'LandingPage',
  components: {
    CoinCards,
  },
  created: async function() {

  },
  data: ()=>{
    return {
      validators: [],
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  #landing-page {
    position: relative;
    z-index: 5;
    background-color: #293031;
    width: 100%;
    min-height: 88vh;
    display: flex;
    flex-direction: column;
  }

  .main-desc {
    padding-top: 10vh;
    padding-left: 10vw;
    text-align: left;
    color: #FAFAFA;
  }
  .secondary-desc {
    padding-left: 16vw;
    text-align: left;
    color: #61ba89;
  }
</style>
