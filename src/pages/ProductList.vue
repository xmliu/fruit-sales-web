<template>
  <div class="container">
    <div class="product-list">
      <div v-for="product in products" :key="product.id" class="product-card">
        <img :src="product.image_url" :alt="product.name" class="product-image" />
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="price">¥{{ (product.price / 100).toFixed(2) }}</p>
          <p class="description">{{ product.description }}</p>
          <button @click="buyProduct(product.id)" class="buy-btn">立即购买</button>
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

function buyProduct(id) {
  router.push(`/checkout/${id}`)
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
</style>