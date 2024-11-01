

import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
const app = createApp(App)
app.mount('#app')


console.log("xxx233")


// const socket = new WebSocket('ws://localhost:10086');
//   socket.onmessage = (event) => {
//     if (event.data === 'reload') {
//       location.reload();
//     }
//   };