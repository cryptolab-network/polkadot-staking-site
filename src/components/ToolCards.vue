<template>
  <div id="tool-cards" class="md-elevation-10">
    <div class='card-container md-layout' v-for="(tool, index) in tools" :key="index">
      <tool-card v-bind:displayName="tool.displayName" v-bind:route="tool.route" v-bind:coinName="tool.coinName" />
    </div>
  </div>
</template>

<script>
import ToolCard from './ToolCard.vue'

export default {
  name: 'ToolCards',
  props: {
    tools: Array
  },
  components: {
    ToolCard
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  #tool-cards {
    margin-top: 10vh;
    padding-bottom: 20px;
    width: 80vw;
    background-color: #76828d;
    margin-left: auto;
    margin-right: auto;
    z-index: 10;
    position: relative;
    display: inline-block;
  }

  .card-container {
    width: 33%;
    min-width: 300px;
    min-height: 268px;
    max-height: 268px;
    margin-bottom: 40px;
    position: relative;
    float: left;
    display: inline;
    vertical-align: top;
  }
</style>