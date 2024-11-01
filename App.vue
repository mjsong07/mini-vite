<template>
 <p>--{{val}}--</p>
<button @click="add">测试+1</button>
</template> 

<script> 
 
import {ref} from 'vue';   
  
export default {
  name: 'HelloWorld', 
  data() {
    return {
        val: 0 
    }  
  },
  methods: {
    add() {
      this.val++
    }
  }
} 
</script>
<style> 
p {
    color: green;
}
</style>