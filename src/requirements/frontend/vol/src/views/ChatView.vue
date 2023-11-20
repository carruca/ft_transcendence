<!-- ChatView.vue -->
<template>
  <div class="chat-view">
    <h1>Chat View</h1>
    <div class="channel-list">
      <ul>
        <li v-for="channel in channelList.values()" :key="channel.uuid" @click="selectChannel(channel.uuid)"
            :class="{ 'selected': channel.uuid === selectedChannelUUID }">
          {{ channel.name }}
        </li>
      </ul>
    </div>
    <div v-if="currentChannel">
      <h2>{{ currentChannel.name }}</h2>
      <div v-for="channelUser in currentChannel.users.values()" :key="channelUser.uuid">
        {{ channelUser.name }} - Admin: {{ channelUser.isAdmin ? 'Yes' : 'No' }}
        - Muted: {{ channelUser.isMuted ? 'Yes' : 'No' }}
        - Banned: {{ channelUser.isBanned ? 'Yes' : 'No' }}
        - Friend: {{ channelUser.isFriend ? 'Yes' : 'No' }}
      </div>
      <div
            v-for="event in currentChannel.events.values()"
            :key="event.uuid"
            :class="{ 'message': event.type === EventTypeEnum.MESSAGE, 'other-event': event.type !== EventTypeEnum.MESSAGE }"
      >
          {{ event.timestamp }} {{ formatEventMessage(event) }}
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted, watch } from 'vue';
import { chatService } from '@/services/chat.service';

import { EventTypeEnum } from '@/services/event-type.enum';
import { Event } from '@/services/models';

export default {
  setup() {
    const selectedChannelUUID = ref('');
    
    const { channelList, currentChannel, setCurrentChannel, isDarkMode } = chatService;

    // Variables reactivas para los estilos
    const textColor = ref('');
    const backgroundColor = ref('');

    // Función para actualizar las variables de estilo
    const updateStyles = () => {
      textColor.value = isDarkMode ? 'white' : 'black';
      backgroundColor.value = isDarkMode ? 'black' : 'white';
    };

    onMounted(() => {
      chatService.startSimulation();

      // Seleccionar el primer canal por defecto al cargar el componente
      if (channelList.value.size > 0) {
        selectedChannelUUID.value = channelList.value.keys().next().value;
        setCurrentChannel(selectedChannelUUID.value);
      }
    });

    const formatEventMessage = (event) => {
        switch (event.type) {
            case EventTypeEnum.MESSAGE:
              return `<${event.sourceUser.name}> ${event.value}`;
            case EventTypeEnum.PART:
              return `${event.sourceUser.name} has left`;
            case EventTypeEnum.KICK:
              return `${event.sourceUser.name} has kicked ${event.targetUser.name}`;
            case EventTypeEnum.BAN:
              return `${event.sourceUser.name} has banned ${event.targetUser.name}`;
            case EventTypeEnum.UNBAN:
              return `${event.sourceUser.name} has unbanned ${event.targetUser.name}`;
            case EventTypeEnum.MUTE:
              return `${event.sourceUser.name} has muted ${event.targetUser.name}`;
            case EventTypeEnum.UNMUTE:
              return `${event.sourceUser.name} has unmuted ${event.targetUser.name}`;
            case EventTypeEnum.PASSWORD:
              if (event.value === undefined)
                return `${event.sourceUser.name} unset a password`;
              return `${event.sourceUser.name} set a password`;
            case EventTypeEnum.CREATE:
              return `${event.sourceUser.name} created the channel`;
            case EventTypeEnum.CLOSE:
              return `${event.sourceUser.name} closed the channel`;
            case EventTypeEnum.JOIN:
              return `${event.sourceUser.name} has joined.`
            case EventTypeEnum.TOPIC:
              return `${event.sourceUser.name} has changed topic to '${event.value}'`;
          }
          return '';
      }

    const selectChannel = (channelUUID) => {
      selectedChannelUUID.value = channelUUID;
      setCurrentChannel(channelUUID);
    };

    watch(isDarkMode, updateStyles, { immediate: true });

    return {
      selectedChannelUUID,
      channelList,
      currentChannel,
      selectChannel,
      EventTypeEnum,
      formatEventMessage,
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
    background-color: #3498db !important; /* Fondo diferente para el elemento seleccionado */
    color: var(--selected-text-color, white); /* Texto diferente para el elemento seleccionado */
  }

  li:hover {
    background-color: #ddd !important; /* var(--hover-background-color, #ddd);*/
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
