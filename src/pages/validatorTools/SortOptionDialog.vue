<template>
<div id="sort-option-dialog">
  <md-dialog :md-active.sync="showDialog" @md-closed="onClose" class="sort-option-dialog" md-title="Sort">
    <md-dialog-title>Filter</md-dialog-title>
    <md-content class="sort-by">
        <md-field>
          <label for="movie">Sort By</label>
          <md-select v-model="sortOptions" name="sortBy" id="sortBy">
            <md-option value="default">Default</md-option>
            <md-option value="alphabetical">Alphabetical</md-option>
            <md-option value="apy">APY</md-option>
          </md-select>
        </md-field>
    </md-content>
    <md-dialog-title>Highlight</md-dialog-title>
    <md-switch class="sort-by" v-model="highlightCommissionChange">Commission Change</md-switch>
    <md-switch class="sort-by" v-model="hideCommissionHigh">Hide commission over 20%</md-switch>
    <md-dialog-actions>
      <md-button class="md-secodary" @click="showDialog = false">Close</md-button>
      <md-button class="md-primary" @click="onSave">Apply</md-button>
    </md-dialog-actions>
  </md-dialog>
</div>
</template>

<script>
export default {
  name: 'sortOptionDialog',
  props: {
    open: Boolean,
  },
  data: function() {
    return {
      showDialog: this.open,
      sortOptions: 'default',
      highlightCommissionChange: true,
      hideCommissionHigh: true,
    }
  },
  mounted: async function() {
    if(localStorage.getItem('ksm.validator.highlight.commissionChange') === '1') {
      this.highlightCommissionChange = true;
    } else {
      this.highlightCommissionChange = false;
    }
    if(localStorage.getItem('ksm.validator.highlight.hideCommissionHigh') === '1') {
      this.hideCommissionHigh = true;
    } else {
      this.hideCommissionHigh = false;
    }
  },
  methods: {
    onClose() {
      this.showDialog = false;
      this.$emit('close-sorting-option');
    },
    onSave() {
      this.showDialog = false;
      this.$emit('close-sorting-option');
      this.$emit('sorting-option', {
        sortBy: this.sortOptions,
        highlights: {
          commissionChange: this.highlightCommissionChange,
          commissionHigh: this.hideCommissionHigh,
        }
      });
      if(this.highlightCommissionChange) {
        localStorage.setItem('ksm.validator.highlight.commissionChange', '1');
      } else {
        localStorage.setItem('ksm.validator.highlight.commissionChange', '0');
      }
      if(this.hideCommissionHigh) {
        localStorage.setItem('ksm.validator.highlight.hideCommissionHigh', '1');
      } else {
        localStorage.setItem('ksm.validator.highlight.hideCommissionHigh', '0');
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.sort-by {
  margin-left: 20px !important;
  margin-right: 28px !important;
}
.sort-option-dialog {
  min-width: 400px !important;
}
</style>