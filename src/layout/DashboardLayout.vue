<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 flex">
    <Sidebar :isCollapsed="isCollapsed" @toggle="toggleSidebar" />
    <div 
      class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
      :class="isCollapsed ? 'ml-20' : 'ml-64'"
    >
      <!-- Top Navbar -->
      <header class="h-16 bg-white/80 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
        <div class="text-sm text-slate-600 font-semibold">
          Sistema de Gestión Multiservicios Leiva
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-sm font-bold text-slate-800">{{ displayName }}</div>
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
import { getUserByAuthId } from '../services/usuarios'

const user = ref(null)
const userProfile = ref(null)
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

onMounted(async () => {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  user.value = authUser
  
  if (authUser) {
    try {
      userProfile.value = await getUserByAuthId(authUser.id)
    } catch (e) {
      console.error('Error fetching user profile:', e)
    }
  }
})

const displayName = computed(() => {
  if (userProfile.value?.nombre) return userProfile.value.nombre
  return user.value?.email || '...'
})

const userEmail = computed(() => user.value?.email || '...')
const userInitial = computed(() => user.value?.email?.[0].toUpperCase() || '?')
const userRole = computed(() => user.value?.user_metadata?.rol || 'Usuario')
</script>
