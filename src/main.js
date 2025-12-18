import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import router from './router'
import App from './App.vue'

import './index.css'
import 'primeicons/primeicons.css'

console.log('--- Cargando App Vue ---')

try {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)
  app.use(VueQueryPlugin)
  app.use(PrimeVue, {
      theme: {
          preset: Aura,
          options: {
              prefix: 'p',
              darkModeSelector: 'system',
              cssLayer: false
          }
      }
  })

  app.mount('#app')
  console.log('--- App Vue Montada correctamente ---')
} catch (error) {
  console.error('--- Error al montar App Vue:', error)
}
