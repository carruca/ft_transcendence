<script setup lang="ts">
import NavBar from './NavBar.vue';
import TopBar from './TopBar.vue';
import Modal from './Modal.vue';
import { onMounted, defineProps, watch, ref } from 'vue';
import { UserSiteRoleEnum } from '@/services/enum/user-site-role.enum'
import { ChatClient } from '@/services/chat-client'

const props = defineProps({
  user: {
    type: Object,
    required: true,
    default: undefined
  }
})

const me = ref(undefined)
const showPopup = ref(false)
const modalProps = ref({
  title: undefined,
  onAccept: undefined,
  onReject: undefined,
  acceptText: undefined,
  rejectText: undefined,
  content: undefined
})

onMounted(() => {
  const client = ChatClient.getInstance()
  const stopMe = watch(client.me, (newVal, oldVal) => {
    if (newVal && !oldVal) {
      me.value = newVal
    }
  })
  watch(client.showModal, (newVal, _oldVal) => {
    showPopup.value = newVal
  })
  watch(client.modalProps, (newVal, _oldVal) => {
    modalProps.value = newVal
  })
  setTimeout(() => {
    stopMe()
  }, 5000)
})

</script>

<template>
  <div class="main_content">
    <TopBar :user="props.user" />
    <NavBar :admin="me?.siteRole == UserSiteRoleEnum.MODERATOR
      || me?.siteRole == UserSiteRoleEnum.OWNER"/>
    <Modal v-if="showPopup" :title="modalProps.title" :onAccept="modalProps.onAccept"
      :onReject="modalProps.onReject" :acceptText="modalProps.acceptText"
      :rejectText="modalProps.rejectText">
      <p>{{ modalProps.content }}</p>
    </Modal>
    <main>
      <router-view :user="props.user" />
    </main>
  </div>
</template>

<style scoped>
.main_content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  display: flex;
}

ul {
  list-style: none;
}

main {
  display: flex;
  width: 100%;
  height: calc(100% - 5em);
  background: var(--bg-color);
  align-self: flex-end;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
</style>
