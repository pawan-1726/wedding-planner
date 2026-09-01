import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/wedding-planner/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        services: resolve(__dirname, 'services.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        packages: resolve(__dirname, 'packages.html'),
        appointment: resolve(__dirname, 'appointment.html'),
        contact: resolve(__dirname, 'contact.html')
      }
    }
  }
})