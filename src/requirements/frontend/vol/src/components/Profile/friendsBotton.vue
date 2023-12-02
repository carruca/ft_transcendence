<script setup lang="ts">
import { ref, onMounted, defineProps } from 'vue';

interface APIResponseFriends {
  senderId: string;
  receiverId: string;
  status: number;
  id: string;
};

interface APIResponseBlocks {
  id: string;
  nickname: string;
  login: string;
};

enum FriendStatus {
  requested,
  accepted,
  rejected,
  add,
};

const props = defineProps({
  users: {
    type: Array as () => string[],
    required: true
  }
});

const users = ref();
const friendState = ref<FriendStatus>(3);
const checkedFriend = ref(false);
let friends : APIResponseFriends[] = [];

let blocks : APIResponseBlocks[] = [];
const blockState = ref(false);

async function takeFriendStatus() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/friends`,
      {
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        },
        credentials: "include",
      });
    if (!response.ok)
    {
      throw new Error('Failed to fetch friends');
    }
    friends = await response.json();
    friends.forEach((friend: APIResponseFriends) => {
      if (friend.senderId === users.value[0] && friend.receiverId === users.value[1] || 
          friend.senderId === users.value[1] && friend.receiverId === users.value[0])
      {
        friendState.value = friend.status;
      }
    });
  } catch (error) {
    console.error(error);
  }
};

async function takeBlockStatus() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/${users.value[0]}/blocks`,
      {
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        },
        credentials: "include",
      });
    if (!response.ok)
    {
      throw new Error("Could not get blocks");
    }
    blocks = await response.json();
    blocks.forEach((block: APIResponseBlocks) => {
      if (block.blockId === users.value[1])
      {
        blockState.value = true;
      }
    });
  } catch (error) {
    console.error(error);
  }
};

async function takeBlockStatus() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/${users.value[0]}/blocks`,
      {
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        },
        credentials: "include",
      });
    if (!response.ok)
    {
      throw new Error("Could not get blocks");
    }
    blocks = await response.json();
    blocks.forEach((block: APIResponseBlocks) => {
      if (block.blockId === users.value[1])
      {
        blockState.value = true;
      }
    });
  } catch (error) {
    console.error(error);
  }
};

async function addFriend() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/friends`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          "senderId" : users.value[0],
          "receiverId": users.value[1],
        })
      });
    if (!response.ok)
    {
      throw new Error("Could not request friend");
    }
    console.log("Friend request added");
    friendState.value = 0;
  } catch (error) {
    console.error(error);
  }
};

async function deleteFriend() {
  try {
    const friendshipID: string | undefined = (() => {
      const foundID = friends.find((friend) => {
        return (
          (friend.senderId === users.value[0] && friend.receiverId === users.value[1]) ||
          (friend.senderId === users.value[1] && friend.receiverId === users.value[0])
        );
      });
      return foundID ? foundID.id : undefined;
    })();
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/friends/${friendshipID}`,
      {
        method: "DELETE",
        headers: {
          "accept": "*/*",
        },
        credentials: "include"
      });
    if (!response.ok)
    {
      throw new Error("Could not delete friend");
    }
    console.log("Deleted");
    friendState.value = 3;
  } catch (error) {
    console.error(error);
  }
};

async function blockIt() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/block`,
      {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          "userId" : users.value[0],
          "blockId": users.value[1],
        })
      });
    if (!response.ok)
    {
      throw new Error("Could not block");
    }
    console.log("Blocked");
    takeBlockStatus();
  } catch (error) {
    console.error(error);
  }
}

async function unblockIt() {
  try {
    const blockID: string | undefined = (() => {
      const foundID = blocks.find((block) => {
        return (
          block.userId === users.value[0] && block.blockId === users.value[1]
        );
      });
      return foundID ? foundID.id : undefined;
    })();
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/block/${blockID}`,
      {
        method: "DELETE",
        headers: {
          "accept": "*/*",
        },
        credentials: "include"
      });
    if (response.ok)
    {
      throw new Error("Could not unblock");
    }
    console.log("Unblocked");
    blockState.value = false;
  } catch (error) {
    console.error(error);
  }
}

onMounted(async () => {
  // debugger;
  users.value = props.users;
  Promise.all([takeFriendStatus(), takeBlockStatus()]);
  takeFriendStatus();
  takeBlockStatus();
  checkedFriend.value = true;
});

</script>

<template>
  <div v-if="checkedFriend">
    <button v-if="friendState === 3" class="fancy-button-green" @click="addFriend">Add to friends</button>
    <button v-if="friendState === 0" class="fancy-button-gray">Pending...</button>
    <button v-if="friendState === 1" class="fancy-button-red" @click="deleteFriend">Remove friend</button>
    <button v-if="friendState === 2" class="fancy-button-red">Rejected</button>
    <button v-if="!blockState" class="fancy-button-red" @click="blockIt">Block</button>
    <button v-if="blockState"  class="fancy-button-red" @click="unblockIt">Unblock</button>
  </div>
</template>

<style scoped>
  .fancy-button-gray {
  padding: 10px 20px;
  font-family: 'Bebas Neue';
  border: none;
  background-color: #393838;
  color: #cfcfcf;
  font-size: 18px;
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.7);
}

  .fancy-button-green {
  padding: 10px 20px;
  font-family: 'Bebas Neue';
  border: none;
  background-color: #4e4e4e;
  color: #fff;
  font-size: 18px;
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.7);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.fancy-button-green:hover {
  transform: translateY(-2px);
  background-color: #40be46;
}

.fancy-button-green:active {
  transform: translateY(1px);
  background-color: #3E8948;
}

.fancy-button-red {
  padding: 10px 20px;
  font-family: 'Bebas Neue';
  border: none;
  background-color: #4e4e4e;
  color: #fff;
  font-size: 18px;
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.7);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.fancy-button-red:hover {
  transform: translateY(-2px);
  background-color: #cc4242;
}

.fancy-button-red:active {
  transform: translateY(1px);
  background-color: #893e3e;
}
</style>
