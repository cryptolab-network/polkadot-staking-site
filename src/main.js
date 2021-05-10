import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.css'
import 'vue-material/dist/theme/default.css'
import 'vue-material-slider/dist/vue-material-slider.css';
import VueMaterialSlider from 'vue-material-slider';
import VueApexCharts from 'vue-apexcharts'
import VueClipboard from 'vue-clipboard2'
import VueMobileDetection from "vue-mobile-detection";
import vuetify from './plugins/vuetify'
 
Vue.use(VueClipboard)
Vue.use(VueApexCharts)

Vue.component('apexchart', VueApexCharts)

Vue.use(VueMaterial)
Vue.use(VueMaterialSlider);
Vue.use(VueRouter);
Vue.use(VueMobileDetection);
Vue.config.productionTip = false;

const oneKValidators = Vue.component('oneKValidators', require('./pages/oneThousandValidators/1kValidatorPage.vue').default);
const nominatingStatus = Vue.component('nominatingStatus', require('./pages/validatorTools/NominatingStatusPage.vue').default);
const validatorStatus = Vue.component('validatorStatus', require('./pages/oneThousandValidators/ValidatorDashboard.vue').default);
const ksmBotGuide = Vue.component('ksmBotGuide', require('./pages/botGuide/KusamaBotGuide.vue').default);
const landingPage = Vue.component('landingPage', require('./components/LandingPage.vue').default);
const toolPage = Vue.component('toolPage', require('./components/ToolPage.vue').default);
const contactPage = Vue.component('contactPane', require('./components/ContactPage.vue').default);
const rewardQuerierPage = Vue.component('rewardQuerierPage', require('./pages/nomintorTools/rewardQuerier.vue').default);

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/tools/oneKValidators', component: oneKValidators, name: 'oneKValidator' },
    { path: '/', component: landingPage, name: 'landingPage'},
    { path: '/tools', component: toolPage, name: 'toolPage'},
    { path: '/contact', component: contactPage, name: 'contactPage'},
    { path: '/tools/validatorStatus', component: validatorStatus, name: 'validatorStatusPage', props: true},
    { path: '/tools/ksmVN', component: nominatingStatus, name: 'nominatingStatusPage', props: {
      coin: 'KSM'
    }},
    { path: '/tools/dotVN', component: nominatingStatus, name: 'nominatingStatusPage', props: {
      coin: 'DOT'
    }},
    { path: '/tools/ksmBotGuide', component: ksmBotGuide, name: 'kusamaBotGuidePage'},
    { path: '/tools/ksmSR', component: rewardQuerierPage, name: 'rewardQuerierPage', props: {
      coinName: 'KSM'
    }},
    { path: '/tools/dotSR', component: rewardQuerierPage, name: 'rewardQuerierPage', props: {
      coinName: 'DOT'
    }},
    { path: '/tools/dotSR/:stash', component: rewardQuerierPage, name: 'rewardQuerierPage', props: {
      coinName: 'DOT'
    }},
  ],
});

export const EventBus = new Vue();

new Vue({
  render: h => h(App),
  router: router,
  vuetify,
}).$mount('#app')
