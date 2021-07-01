<template>
  <div id="site-nav">
    <md-app md-mode="fixed" >
      <md-app-toolbar class="site-nav">
        <img v-if="currentRoute !== '/tools/ksmVN' && currentRoute !== '/tools/dotVN'" src="../assets/logo_small.png"/>
        <img v-if="currentRoute === '/tools/ksmVN'" src="../assets/logo_ksm_small.png"/>
        <img v-if="currentRoute === '/tools/dotVN'" src="../assets/logo_dot_small.png"/>
      <span class="md-title" @click="onClickTitle"><span style="color:#61ba89">Crypto</span><span style="color:#61ba89">Lab</span></span>
      <div class="md-toolbar-section-end">
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
import Vue from 'vue'
import VueMeta from 'vue-meta'
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
    }
  },
  watch:{
    $route (to){
      this.currentRoute = to.path;
    }
} 
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
</style>
