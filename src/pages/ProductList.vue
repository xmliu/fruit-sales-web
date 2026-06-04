<template>
  <div class="container">
    <div class="product-list">
      <div v-for="product in products" :key="product.id" class="product-card">
        <img :src="product.image_url" :alt="product.name" class="product-image" />
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="price">¥{{ (product.price / 100).toFixed(2) }}</p>
          <p class="description">{{ product.description }}</p>
          <div class="quantity-control">
            <button @click="decreaseQty(product)" :disabled="product.quantity <= 1">-</button>
            <span>{{ product.quantity || 1 }}</span>
            <button @click="increaseQty(product)">+</button>
          </div>
          <button @click="buyProduct(product)" class="buy-btn" :class="{ disabled: product.name.includes('苹果') }">立即购买</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const products = ref([])

async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')

  if (error) {
    console.error('获取商品失败:', error)
    return
  }
  products.value = data
}

function buyProduct(product) {
  router.push({ path: `/checkout/${product.id}`, query: { qty: product.quantity || 1 } })
}

function increaseQty(product) {
  if (!product.quantity) product.quantity = 1
  product.quantity++
}

function decreaseQty(product) {
  if (!product.quantity) product.quantity = 2
  if (product.quantity > 1) product.quantity--
}

onMounted(fetchProducts)
</script>

<style scoped>
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px;
}
h1 {
  text-align: center;
  margin-bottom: 30px;
}
.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
.product-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.product-info {
  padding: 15px;
}
.price {
  color: #e63946;
  font-size: 1.2em;
  font-weight: bold;
}
.description {
  color: #666;
  font-size: 0.9em;
}
.quantity-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
}
.quantity-control button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1.2em;
}
.quantity-control button:disabled {
  color: #ccc;
  cursor: not-allowed;
}
.quantity-control span {
  min-width: 30px;
  text-align: center;
  font-weight: bold;
}
.buy-btn {
  width: 100%;
  padding: 10px;
  background: #e63946;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}
.buy-btn:hover {
  background: #c5303c;
}
.buy-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>