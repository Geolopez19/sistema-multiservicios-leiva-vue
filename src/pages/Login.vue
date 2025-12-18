<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
      <div class="flex flex-col items-center mb-8">
        <div class="bg-indigo-600 p-3 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
          <Package class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-slate-800">Multiservicios Leiva</h1>
        <p class="text-slate-500">Bienvenido, ingresa tus credenciales</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Mail class="w-5 h-5" />
            </span>
            <input 
              v-model="email" 
              type="email" 
              placeholder="admin@ejemplo.com"
              class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
              required 
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lock class="w-5 h-5" />
            </span>
            <input 
              v-model="password" 
              type="password" 
              placeholder="••••••••"
              class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
              required 
            />
          </div>
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Loader v-if="loading" class="w-5 h-5 animate-spin mr-2" />
          {{ loading ? 'Iniciando sesión...' : 'Entrar al sistema' }}
        </button>

        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'vue-router'
import { Mail, Lock, Package, AlertCircle, Loader } from 'lucide-vue-next'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  try {
    console.log('Login: Intentando iniciar sesión para:', email.value)
    loading.value = true
    errorMessage.value = ''
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) throw error

    console.log('Login: Éxito, redireccionando...')
    router.push('/')
    
  } catch (error) {
    console.error('Login: Error:', error)
    if (error.message === 'Invalid login credentials' || error.message.includes('Email not confirmed')) {
      errorMessage.value = 'Credenciales inválidas o correo no verificado.'
    } else {
      errorMessage.value = error.message || 'Ocurrió un error al iniciar sesión.'
    }
  } finally {
    loading.value = false
  }
}
</script>
