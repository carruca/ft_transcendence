<!-- ChatView.vue -->
<template>
  <div class="chat-view">
    <h1>Chat View</h1>
    <div class="channel-list">
      <ul>
        <li v-for="channel in channelList" :key="channel.id" @click="selectChannel(channel.id)"
            :class="{ 'selected': channel.id === selectedChannelId }">
          {{ channel.name }}
        </li>
      </ul>
    </div>
    <div v-if="currentChannel">
      <h2>{{ currentChannel.name }}</h2>
      <div v-for="channelUser in currentChannel.users.values()" :key="channelUser.id">
        {{ channelUser.nickname }}
        - Owner: {{ channelUser.isOwner ? 'Yes' : 'No'}}
        - Admin: {{ channelUser.isAdmin ? 'Yes' : 'No' }}
        - Muted: {{ channelUser.isMuted ? 'Yes' : 'No' }}
        - Banned: {{ channelUser.isBanned ? 'Yes' : 'No' }}
        - Friend: {{ channelUser.isFriend ? 'Yes' : 'No' }}
        - Blocked: {{ channelUser.isBlocked ? 'Yes' : 'No' }}
        - Status: {{ ["Offline", "Online", "In Game", "Away"][channelUser.status] }}
      </div>
      <div
          v-for="event in currentChannel.events_.values()"
          :key="event.id"
          :title="printTime(event.timestamp)"
          :class="{ 'message': event.type === EventTypeEnum.MESSAGE, 'other-event': event.type !== EventTypeEnum.MESSAGE }"
      >
        {{ formatEventMessage(event) }}
      </div>
    </div>
    <div v-else>
      <p>No channel selected.</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';

import { client } from '@/services/chat-client';
import { EventTypeEnum } from '@/services/enum';
import { Event } from '@/services/model';

export default {
  setup() {
    //const chat = client;
    const selectedChannelId = ref('');
    
    const { channelList, currentChannel, setCurrentChannel } = client;


    const textColor = ref('');
    const backgroundColor = ref('');

    onMounted(() => {
      // client.playSim();
      if (currentChannel.value)
        selectedChannelId.value = currentChannel.value.id;
    });

    const selectChannel = (channelId) => {
      selectedChannelId.value = channelId;
      setCurrentChannel(channelId);
    };

    const printTime = (time) => {
      return `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
    };

/*
    watch(() => channelList, (newChannels) => {
      channelList.value = newChannels;
    });
*/
    const formatEventMessage = (event) => {
      switch (event.type) {
        case EventTypeEnum.MESSAGE:
          return `<${event.sourceNickname}> ${event.value}`;
        case EventTypeEnum.PART:
          return `- ${event.sourceNickname} has left`;
        case EventTypeEnum.KICK:
          return `- ${event.sourceNickname} has kicked ${event.targetNickname}`;
        case EventTypeEnum.BAN:
          return `- ${event.sourceNickname} has banned ${event.targetNickname}`;
        case EventTypeEnum.UNBAN:
          return `- ${event.sourceNickname} has unbanned ${event.targetNickname}`;
        case EventTypeEnum.MUTE:
          return `- ${event.sourceNickname} has muted ${event.targetNickname}`;
        case EventTypeEnum.UNMUTE:
          return `- ${event.sourceNickname} has unmuted ${event.targetNickname}`;
        case EventTypeEnum.PASSWORD:
          if (event.value === undefined)
            return `- ${event.sourceNickname} unset a password`;
          return `- ${event.sourceNickname} set a password`;
        case EventTypeEnum.CREATE:
          return `- ${event.sourceNickname} created the channel`;
        case EventTypeEnum.CLOSE:
          return `- ${event.sourceNickname} closed the channel`;
        case EventTypeEnum.JOIN:
          return `- ${event.sourceNickname} has joined.`
        case EventTypeEnum.TOPIC:
          return `- ${event.sourceNickname} has changed topic to '${event.value}'`;
      }
      return '';
    }

    return {
      channelList,
      currentChannel,
      selectedChannelId,
      EventTypeEnum,
      formatEventMessage,
      selectChannel,
      printTime,
    };
  },
/*  methods: {
    formatTimestamp(timestamp: Date) {
      return timestamp.toLocaleString();
    }
  },*/
};
</script>

<style scoped>

.chat-view {
  /* Estilos generales para el componente ChatView */
}

.channel-list {
  ul {
    list-style: none;
    padding: 0;
  }

  li {
    cursor: pointer;
    padding: 8px;
    margin-bottom: 4px;
    background-color: var(--background-color, white);
    color: var(--text-color, black);
  }

  li.selected {
    background-color: #3498db; /* Fondo diferente para el elemento seleccionado */
    color: var(--selected-text-color, white); /* Texto diferente para el elemento seleccionado */
  }

  li:hover {
    background-color: #ddd; /* var(--hover-background-color, #ddd);*/
  }
}

.chat-container {
  color: var(--text-color); /* Utiliza variables CSS para el color del texto */
  background-color: var(--background-color); /* Utiliza variables CSS para el color de fondo */
}

h1, h2, div {
  color: var(--text-color, white);
}

.message {
  color: green;
}

.other-event {
  color: gray;
}

/*
:root {
  --text-color: black; 
  --background-color: white;
}*/

</style>
