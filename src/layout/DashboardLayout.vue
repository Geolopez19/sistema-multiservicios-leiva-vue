<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 flex">
    <Sidebar />
    <div class="flex-1 ml-64 flex flex-col min-h-screen">
      <!-- Top Navbar -->
      <header class="h-16 bg-white/80 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
        <div class="text-sm text-slate-600 font-semibold">
          Sistema de Gestión Multiservicios Leiva
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-sm font-bold text-slate-800">{{ userEmail }}</div>
            <div class="text-xs text-indigo-600 capitalize font-medium">{{ userRole }}</div>
          </div>
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
            {{ userInitial }}
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import { supabase } from '../lib/supabaseClient'

const user = ref(null)

onMounted(async () => {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  user.value = authUser
})

const userEmail = computed(() => user.value?.email || '...')
const userInitial = computed(() => user.value?.email?.[0].toUpperCase() || '?')
const userRole = computed(() => user.value?.user_metadata?.rol || 'Usuario')
</script>
