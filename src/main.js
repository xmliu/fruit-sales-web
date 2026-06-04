import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import ProductList from './pages/ProductList.vue'
import Checkout from './pages/Checkout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: ProductList },
    { path: '/checkout/:id', component: Checkout }
  ]
})

createApp(App).use(router).mount('#app')