<script setup lang="ts">
import NavBar from './NavBar.vue';
import TopBar from './TopBar.vue';
import Modal from './Modal.vue';
import { onMounted, defineProps, watch, ref } from 'vue';
import { UserSiteRoleEnum } from '@/services/enum/user-site-role.enum'
import { ChatClient } from '@/services/chat-client'
import Toast from './Toast.vue'

interface APIResponseFriends {
  senderId: string;
  receiverId: string;
  status: number;
  id: string;
};

enum FriendStatus {
  requested,
  accepted,
  rejected,
  add,
};

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

const toastError = ref(undefined)

onMounted(async () => {
  const client = ChatClient.getInstance()
  const stopMe = watch(client.me, (newVal, oldVal) => {
    if (newVal && !oldVal) {
      me.value = newVal
      props.user.admin = newVal.siteRole_ > 0;
    }
  })
  watch(client.toastMessage, (newVal, _oldVal) => {
    if (newVal) {
      toastError.value = newVal
    }
  })
  watch(client.showModal, (newVal, _oldVal) => {
    showPopup.value = newVal
  })
  watch(client.modalProps, (newVal, _oldVal) => {
    modalProps.value = newVal
  })
  watch(friendPetition, (newVal, _oldVal) => {
    if (newVal.length > 0) {
      iterator = nextFriend(friendPetition.value);
      currentFriendPetition.value = iterator.next().value;
      return
    }
    iterator = undefined
    currentFriendPetition.value = undefined
  })
  await takeFriendStatus();
  setTimeout(() => {
    stopMe()
  }, 5000)
})

const clearError = () => {
  toastError.value = undefined
};

const friendPetition = ref<APIResponseFriends[]>([]);

function* nextFriend(friends : APIResponseFriends[]) {
  for (const friend of friends) {
    yield friend;
  }
};

let iterator: Generator<APIResponseFriends, void, unknown> | undefined = undefined;
const currentFriendPetition = ref<APIResponseFriends>(null);

async function takeFriendStatus() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/me/pending-friends`,
      {
        method: "GET",
        headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
      });
    if (!response.ok)
    {
      throw new Error("Could not get friends");
    }
    const friends = await response.json();
    friendPetition.value = friends.filter((friend: APIResponseFriends) => friend.receiverId === me.value.id)
  } catch (error) {
    console.error(error);
  }
};

async function handlePetition(friend : APIResponseFriends, status : FriendStatus) {
  try {
    const url = new URL(`${import.meta.env.VITE_BACKEND_URL}/friends/${friend.id}`);
    url.searchParams.append("status", status.toString());
    const response = await fetch(
      url,
      {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        },
        credentials: "include"
      });
    if (!response.ok)
    {
      throw new Error("Could not get friends");
    }
  } catch (error) {
    console.error(error);
  }
  if (iterator) {
    currentFriendPetition.value = iterator.next().value;
  }
};

</script>

<template>
  <div class="main_content">
    <Toast v-if="toastError != undefined" :error-message="toastError" :close-toast="clearError">
      <i class="material-icons">error</i>
    </Toast>
    <TopBar :user="props.user" />
    <NavBar :admin="props.user.admin"/>
    <Modal v-if="showPopup" :title="modalProps.title" :onAccept="modalProps.onAccept"
      :onReject="modalProps.onReject" :acceptText="modalProps.acceptText"
      :rejectText="modalProps.rejectText">
      <p>{{ modalProps.content }}</p>
    </Modal>
    <Modal v-if="currentFriendPetition" :title="'Friend request'" :on-accept="() => handlePetition(currentFriendPetition, FriendStatus.accepted)"
      :on-reject="() => handlePetition(currentFriendPetition, FriendStatus.rejected)">
      <p>{{ currentFriendPetition.user[0].nickname }} wants to be your friend</p>
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

.material-icons {
  color: #fafafa;
}

</style>
