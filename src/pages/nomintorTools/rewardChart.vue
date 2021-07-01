<template>
  <div id="reward-chart">
    <apexchart ref="reward-distribution" id="reward-distribution" width='100%' type="line" :options="rewardOptions" :series="rewardSeries"/>
  </div>
</template>

<script>
import moment from 'moment';
export default {
  name: 'RewardChart',
  props: {
    eraRewards: Array,
    series: String,
    coinName: String
  },
  data: function() {
    return {
      units: [],
      rewardDistribution: [],
      title: '',
      rewardOptions: {
        chart: {
          id: 'reward-distribution'
        },
        xaxis: {
          categories: this.units,
        },
        fill: {
          colors: ['#61ba89']
        },
        colors: [
          '#61ba89'
        ],
        title: {
          text: this.title,
           style: {
            fontSize:  '20px',
            fontWeight: 500,
            fontFamily:  'Roboto',
            color:  '#2c3e50'
          },
        },
        yaxis: [
          {
            min: 0,
            title: {
              text: this.coinName,
              style: {
                color: '#61BA89',
              }
            },
            seriesName: 'Rewards'
          },
        ],
        tooltip: {
          y: {
            formatter: (value) => {
              return value + ' ' + this.coinName;
            }
          }
        }
      },
      rewardSeries: [{
        name: 'Rewards',
        data: this.rewardDistribution,
      }],
    }
  },
  watch: {
    eraRewards: function(){
      this.initChart();
    }
  },
  mounted: function() {
    this.initChart();
  },
  methods: {
    initChart() {
      switch(this.series) {
        case 'weekly':
          this.title = 'Weekly Rewards';
      }
      this.rewardDistribution = [];
      this.units = [];
      this.eraRewards.forEach((reward)=>{
        const week = moment(reward.date).week();
        const year = moment(reward.date).year();
        const i = this.units.findIndex((element) => element === year + ' W' + week);
        if(i < 0) {
          this.units.push(year + ' W' + week);
          this.rewardDistribution.push(reward.amount);
        } else {
          this.rewardDistribution[i] += reward.amount;
        }
      });
      let maxRewards = 0;
      this.rewardDistribution = this.rewardDistribution.map((dist)=>{
        if(dist > maxRewards) {
          maxRewards = dist;
        }
        return dist.toFixed(3);
      });
      if(maxRewards === 0) {
        maxRewards = 1;
      }
      this.$refs['reward-distribution'].updateSeries([{
        data: this.rewardDistribution,
      }], false, true);
      this.$refs['reward-distribution'].updateOptions({
        xaxis: {
          categories: this.units
        },
        title: {
          text: this.title,
        },
        yaxis: [
          {
            min: 0,
            max: maxRewards,
            title: {
              text: this.coinName,
            },
          },
        ],
      });
    }
  },

}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  
</style>