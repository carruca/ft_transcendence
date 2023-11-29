<script setup lang="ts">
import NavBar from './NavBar.vue';
import TopBar from './TopBar.vue';
import Modal from './Modal.vue';
import { onMounted } from 'vue';

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
});

// TODO: Get current user image pic
// TODO: Separate this into components

let friends : APIResponseFriends[] = [];
let friendPetition : APIResponseFriends[] = [];

async function takeFriendStatus() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/friends`,
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
    friends = await response.json();
    friendPetition = friends.filter(friend => friend.receiverId === props.user.id && friend.status === 0);
    console.log(friendPetition)
  } catch (error) {
    console.error(error);
  }
};

async function handlePetition(friend : APIResponseFriends, accepted : FriendStatus) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/friends`,
      {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          "friendId": friend.id,
          "status": accepted,
        }),
      });
    if (!response.ok)
    {
      throw new Error("Could not get friends");
    }
    friends = await response.json();
    friendPetition = friends.filter(friend => friend.receiverId === props.user.id && friend.status === 0);
  } catch (error) {
    console.error(error);
  }
};

async function acceptPetition(friend : APIResponseFriends) {
  handlePetition(friend, 1);
};

async function rejectPetition(friend : APIResponseFriends) {
  handlePetition(friend, 2);
};

onMounted(async () => {
  await takeFriendStatus();
});

</script>

<template>
  <div class="main_content">
    <TopBar :user="props.user" />
    <NavBar :admin="props.user.admin || true"/>  <!-- TODO: get props.user.admin-->
    <main>
      <router-view :user="props.user" />
    </main>
  </div>
  <template v-for="friend in friendPetition" :key="friend.id">
    <Modal :title="friend.senderId" :text="friend.receiverId" :on-accept="() => acceptPetition(friend)" :on-reject="() => rejectPetition(friend)" />
  </template>
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
