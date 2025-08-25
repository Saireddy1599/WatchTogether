export default {
  build: {
    rollupOptions: {
      external: [
        'firebase/auth',
        'firebase/app',
        'firebase/firestore'
      ]
    }
  }
}
