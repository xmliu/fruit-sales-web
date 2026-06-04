<template>
  <div class="container">
    <button @click="$router.back()" class="back-btn">← 返回</button>

    <div v-if="product" class="checkout-box">
      <div class="product-summary">
        <img :src="product.image_url" :alt="product.name" class="product-image" />
        <div>
          <h2>{{ product.name }}</h2>
          <p class="price">¥{{ (product.price / 100).toFixed(2) }} × {{ quantity }} = ¥{{ (totalPrice / 100).toFixed(2) }}</p>
        </div>
      </div>

      <form @submit.prevent="submitOrder">
        <div class="form-group">
          <label>地址粘贴栏（从其他平台复制地址到这里自动识别）</label>
          <textarea v-model="pasteAddress" @input="parseAddress" class="paste-input" placeholder="粘贴收货地址，自动识别姓名、电话、地址"></textarea>
        </div>

        <div class="form-group">
          <label>姓名</label>
          <input v-model="form.name" type="text" required placeholder="请输入您的姓名" />
        </div>
        <div class="form-group">
          <label>电话</label>
          <input v-model="form.phone" type="tel" required placeholder="请输入您的电话" />
        </div>
        <div class="form-group">
          <label>地址</label>
          <input v-model="form.address" type="text" required placeholder="请输入您的收货地址" />
        </div>
        <div class="form-group">
          <label>备注（用于填写付款单号）</label>
          <textarea v-model="form.note" placeholder="请填写微信/支付宝付款单号"></textarea>
        </div>
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '提交中...' : '提交订单' }}
        </button>
      </form>
    </div>

    <!-- 支付提示弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>订单提交成功</h2>
        <div class="qr-section">
          <img :src="qrCodeUrl" alt="收款二维码" class="qr-code" />
        </div>
        <div class="order-info">
          <p class="amount">订单金额：<strong>¥{{ (lastOrder?.total_amount / 100).toFixed(2) }}</strong></p>
          <p class="order-id">订单号：<strong>{{ lastOrder?.id }}</strong></p>
        </div>
        <div class="payment-guide">
          <p>由于微信对个人收款码限制识别</p>
          <p>建议您长按图片选择【转发给朋友】</p>
          <p>然后在聊天对话框中长按识别支付<strong>¥{{ (lastOrder?.total_amount / 100).toFixed(2) }}</strong>元，</p>
          <p>务必在备注中填写订单号<strong>{{ lastOrder?.id }}</strong>，</p>
          <p>支付完成后我们为您发货。</p>
        </div>
        <button @click="showModal = false" class="close-btn">我知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'

const route = useRoute()
const router = useRouter()

const product = ref(null)
const quantity = ref(1)

if (route.query.qty) {
  quantity.value = parseInt(route.query.qty) || 1
}
const loading = ref(false)
const showModal = ref(false)
const lastOrder = ref(null)
const qrCodeUrl = ref('')

const form = ref({
  name: '',
  phone: '',
  address: '',
  note: ''
})
const pasteAddress = ref('')

function parseAddress() {
  const text = pasteAddress.value.trim()
  if (!text) return

  // 匹配手机号（11位数字，前三位常见号段）
  const phoneMatch = text.match(/1[3-9]\d{9}/)
  if (phoneMatch) {
    form.value.phone = phoneMatch[0]
  }

  // 匹配收货人姓名（通常是地址开头或名字+电话格式）
  const lines = text.split(/[\n\r]+/)
  for (const line of lines) {
    // 去掉手机号后的内容，取前面的部分作为姓名
    const phoneIdx = line.search(/1[3-9]\d{9}/)
    if (phoneIdx > 0) {
      const name = line.substring(0, phoneIdx).replace(/[^a-zA-Z一-龥]/g, '').trim()
      if (name && !form.value.name) {
        form.value.name = name
      }
    }
  }

  // 尝试提取地址（去除姓名和电话后的内容）
  let address = text
    .replace(/1[3-9]\d{9}/g, '')
    .replace(/收货人|收货地址|地址|电话|手机号码|：|:/g, '')
    .trim()
  // 去掉开头的姓名
  const phoneIdx = address.search(/1[3-9]\d{9}/)
  if (phoneIdx > 0) {
    address = address.substring(phoneIdx)
  }
  address = address.replace(/\s+/g, ' ').trim()
  if (address && address.length > 5) {
    form.value.address = address
  }
}

const totalPrice = computed(() => product.value ? product.value.price * quantity.value : 0)

async function fetchProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error) {
    console.error('获取商品失败:', error)
    router.push('/')
    return
  }
  product.value = data
}

async function submitOrder() {
  loading.value = true
  const { data, error } = await supabase
    .from('orders')
    .insert({
      product_id: product.value.id,
      customer_name: form.value.name,
      phone: form.value.phone,
      address: form.value.address,
      quantity: quantity.value,
      total_amount: totalPrice.value,
      order_note: form.value.note
    })
    .select()
    .single()

  loading.value = false

  if (error) {
    alert('订单提交失败: ' + error.message)
    return
  }

  lastOrder.value = data
  await loadQrCodeUrl()
  showModal.value = true
}

async function loadQrCodeUrl() {
  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('id', 'qr_code_url')
    .single()

  if (!error && data?.value) {
    let url = data.value
    // 签名URL转永久URL
    const signMatch = url.match(/storage\.supabase\.co\/storage\/v1\/object\/sign\/([^?]+)/)
    if (signMatch) {
      url = url.replace('/sign/', '/public/').split('?')[0]
    }
    qrCodeUrl.value = url
  }
}

onMounted(fetchProduct)
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
.back-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  margin-bottom: 20px;
}
.checkout-box {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}
.product-summary {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}
.price {
  color: #e63946;
  font-size: 1.1em;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}
.form-group textarea {
  resize: vertical;
  min-height: 80px;
}
.form-group textarea.paste-input {
  border-color: #4CAF50;
  background: #f0f8f0;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #e63946;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}
.submit-btn:disabled {
  background: #ccc;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}
.qr-section {
  margin: 20px 0;
}
.qr-code {
  width: 200px;
  height: 200px;
  border: 1px solid #eee;
}
.order-info {
  margin: 15px 0;
}
.amount {
  font-size: 1.2em;
  color: #e63946;
}
.order-id {
  color: #333;
  margin-top: 5px;
}
.payment-guide {
  background: #fff8e6;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
  text-align: left;
}
.payment-guide p {
  margin: 5px 0;
  line-height: 1.6;
  font-size: 13px;
}
.close-btn {
  padding: 10px 30px;
  background: #e63946;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>