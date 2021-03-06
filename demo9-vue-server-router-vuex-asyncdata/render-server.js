const Vue = require('vue')
const VueRouter = require('vue-router')
const Vuex = require('vuex')
const axios = require('axios')

function createApp() {
  /**
 * 组件
 */
const ComIndex = Vue.extend({
  name: 'index',
  template: `<div>这是首页</div>`
})
const ComList = Vue.extend({
  name: 'ComList',
  computed: {
    list() {
      return this.$store.state.list
    }
  },
  template: `<div>
    <h1>SSR 数据预取</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`,
  asyncData({ store, route }) {
    /**
     * 这里要 return 出去，因为 server.js 中需要在 then 中处理state 同步
     */
    return store.dispatch('fetchList', route.params.id)
  },
  beforeMount() {
    const { $options: { asyncData }, $store:store, $route:route } = this
    asyncData({store, route}).then(() => {
      console.log('async data is successed');
    })
  },
})


const App = Vue.extend({
  name: 'App',
  template: `<div id="app">
    <router-link to="/">首页</router-link>
    <router-link to="/list/99">列表</router-link>
    <router-view></router-view>
  </div>`
})

/**
 * 路由
 */
Vue.use(VueRouter)
const routes = [
  { path: '/', component: ComIndex},
  { path: '/list/:id', component: ComList},
]

const router = new VueRouter({
  mode: 'history',
  routes
})

/**
 * 数据状态 store
 */

Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    list: []
  },
  mutations: {
    SET_LIST(state, payload) {
      state.list = payload
    }
  },
  actions: {
    fetchList({ commit }, payload) {

      /**
       * 坑一： 需要区分浏览器客户端与服务端的环境区别
       * 服务端如果直接用 /，指向的是 localhost:80
       */
      if (typeof window !== 'undefined') {
        axios.default.baseURL = '/'
      } else {
        axios.defaults.baseURL = 'http://localhost:3000';
      }
      /**
       * 坑二：这里要 return 出去，因为 server.js 中需要在 then 中处理 store.state 的同步
       */
      console.log('payload params.id server', payload);
      return axios.get(`/api/list`).then(res => {
        if (res.status === 200) {
          commit('SET_LIST', res.data)
        } else {
          return Promise.reject(res.statusText)
        }
      }).catch(err => {
        return Promise.reject(err)
      })
    }
  }
})

const app = new Vue({
  router,
  store,
  render: h => h(App)
})

  return {
    app: app,
    router,
    store
  }
}

exports.createApp = createApp