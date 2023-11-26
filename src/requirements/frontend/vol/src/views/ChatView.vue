<!-- ChatView.vue -->
<template>
  <div class="chat-view">
    <div class="content" ref="contentSection">
      <!-- Column for Channel List -->
      <div class="section channels-section" ref="leftSection">
        <div class="section-header">
          <h2>Channels</h2>
          <div class="buttons">
            <button class="buttons" @click="handleJoinClick">Join</button>
            <button class="buttons" @click="handleCreateClick">New</button>
          </div>
        </div>
        <div class="scrollable-content">
          <div class="channel-list">
            <ul class="list">
              <li
                  v-for="channel in channelList"
                  :key="channel.id"
                  @click="selectChannel(channel.id)"
                  @contextmenu="onRightClick(channel, channel, $event)"
                  :class="[ channelClass(channel), { 'selected': channel.id === selectedChannelUUID }, { 'selected': channel.id === contextChannelUUID } ]"
              >
                {{ channel.name }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <!-- Resizer between columns -->
      <div class="resizer" ref="leftResizer"></div>
      <!-- Column for Events -->
      <div class="section events-section" ref="middleSection">
        <div class="section-header">
          <h2>Chat</h2>
        </div>
        <div class="scrollable-content" ref="eventsDisplay">
          <div class="list" v-if="currentChannel">
            <h2>{{ currentChannel.name }}</h2>
            <div
                v-for="event in formattedEvents"
                :key="event.id"
                :title="printTime(event.timestamp)"
                :class="[ 'event', { 'other-event': !isMessageEvent(event) }, { 'selected': event.id === contextEventUUID } ]"
                :style="isMessageEvent(event) ? { color: stringToColor(event.sourceNickname) } : {}">
              <span v-if="isMessageEvent(event)">&lt;</span>
              <span v-if="!isMessageEvent(event)"> - </span>
              <span
                  class="event-user"
                  @click="onClick(event, event.sourceUser)" 
                  @contextmenu="onRightClick(event, event.sourceNickname, $event)">
                {{ event.sourceNickname }}
              </span>
              <span v-if="isMessageEvent(event)">&gt;</span>
              {{ event.message }}
              <span
                  v-if="isTargetEvent(event)"
                  class="event-user"
                  @click="onClick(event, event.targetUser)" 
                  @contextmenu="onRightClick(event, event.targetUser, $event)">
                {{ event.targetNickname }}
              </span>
            </div>
          </div>
          <div v-else>
            <p>No channel selected.</p>
          </div>
        </div>
        <div class="message-input">
          <input type="text" v-model="newMessage" @keyup.enter="sendMessage" placeholder="Message...">
          <button @click="sendMessage">Send</button>
        </div>
      </div>
      <!-- Resizer between columns -->
      <div class="resizer" ref="rightResizer"></div>
      <!-- Column for User List -->
      <div class="section users-section" ref="rightSection" v-if="currentChannel">
        <div class="section-header">
          <h2>Users</h2>
        </div>
        <div class="scrollable-content">
          <div class="user-list">
            <ul class="list">
              <li
                  v-for="channelUser in currentChannel.users.values()"
                  :key="channelUser.id"
                  :class="{ selected: channelUser.id === contextUserUUID }"
                  @click="onClick(channelUser, channelUser)"
                  @contextmenu="onRightClick(channelUser, channelUser, $event)"
              >
                  <span :class="userStatus(channelUser.user.status)">
                    <!--
                    &#x25CF;
                    -->
                    &#x2B24;
                  </span>
                  &nbsp;
                  <span :class="userClass(channelUser)">
                    {{ channelUser.nickname }}
                    {{ channelUser.isOwner ? '(owner)' : '' }}
                    {{ channelUser.isAdmin && !channelUser.isOwner ? '(admin)' : '' }}
                    {{ channelUser.isMuted ? '(muted)' : '' }}
                    {{ channelUser.isBanned ? '(banned)' : '' }}
                    {{ channelUser.isFriend ? '(friend)' : '' }}
                  </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
  <contextMenu
      :visible="showContextMenu"
      :position="contextMenuPosition"
      :options="contextMenuOptions"
      :item="contextMenuItem"
      @select="handleContextMenuSelect"
  />
  <joinChannelModal
      :visible="showJoinModal"
      :channels="channelsSummary"
      @select="handleJoinModalSelect"
      @close="handleJoinModalClose"
  />
  <createChannelModal
      :visible="showCreateModal"
      @create="handleCreateModalCreate"
      @close="handleCreateModalClose"
  />
  <editChannelModal
      :visible="showEditModal"
      @save="handleEditModalSave"
      @close="handleEditModalClose"
  />
  <confirmModal
      :visible="showConfirmModal"
      :title="confirmModalTitle"
      :text="confirmModalText"
      @confirm="handleConfirmModalConfirm"
      @close="() => showConfirmModal = false"
  />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue';
import contextMenu from '@/components/ContextMenu.vue';
import joinChannelModal from '@/components/JoinChannelModal.vue';
import createChannelModal from '@/components/CreateChannelModal.vue';
import editChannelModal from '@/components/EditChannelModal.vue';
import confirmModal from '@/components/ConfirmModal.vue';
// FIXME real client
import { Channel, ChannelUser, User, Event, ChatEvent } from '@/services/model';
import { client } from '@/services/chat-client';
import { EventTypeEnum, UserSiteRoleEnum, UserStatusEnum } from '@/services/enum';
const { channelsSummary, channelList, currentChannel, setCurrentChannel } = client;

const selectedChannelUUID = ref(null);

const contentSection = ref(null);

const leftSection = ref(null);
const rightSection = ref(null);
const middleSection = ref(null);
const leftResizer = ref(null);
const rightResizer = ref(null);

const eventsDisplay = ref(null);
const newMessage = ref('');

// Context menu
const contextChannelUUID = ref(null);
const contextEventUUID = ref(null);
const contextUserUUID = ref(null);

const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuOptions = ref([]);
const contextMenuItem = ref(null);

const contextAction = ref('');

// Modals
const showJoinModal = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showConfirmModal = ref(false);

const confirmModalTitle = ref('');
const confirmModalText = ref('');

onMounted(() => {
  // Update the CSS variable initially
  updateResizerWidth();

  // FIXME temporarily simulation
  //client.playAdminSim();

  if (currentChannel.value !== null);
    selectedChannelUUID.value = currentChannel.value.id;
  window.addEventListener('click', closeContextMenu);
  leftResizer.value.addEventListener('mousedown', e => initDrag(e, leftSection.value, middleSection.value, rightSection.value, contentSection.value, true));
  rightResizer.value.addEventListener('mousedown', e => initDrag(e, leftSection.value, middleSection.value, rightSection.value, contentSection.value, false));
  window.addEventListener('resize', e => handleResize(leftSection.value, middleSection.value, rightSection.value, contentSection.value));
  scrollToBottom();
});

onBeforeUnmount(() => {
  window.addEventListener('click', closeContextMenu);
  if (leftResizer.value) {
    leftResizer.value.removeEventListener('mousedown', e => initDrag(e, leftSection.value));
  }
  if (rightResizer.value) {
    rightResizer.value.removeEventListener('mousedown', e => initDrag(e, rightSection.value));
  }
  window.removeEventListener('resize', e => handleResize(leftSection.value, middleSection.value, rightSection.value, contentSection.value));
});

// Define a ref for the resizer width
const resizerWidth = ref(5); // The initial value in px
const updateResizerWidth = () => {
  document.documentElement.style.setProperty('--resizer-width', `${resizerWidth.value}px`);
};

const selectChannel = (channelUUID) => {
  selectedChannelUUID.value = channelUUID;
  setCurrentChannel(channelUUID);
};

const printTime = (time) => {
  return `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
};

// Uncomment and adapt the watch statement if needed
// watch(channelList, (newChannels, oldChannels) => {
//   // Handle changes
// });

const isNearBottom = () => {
  const chatContainer = eventsDisplay.value;
  if (!chatContainer)
    return;
  return chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 100;
};
const scrollToBottom = () => {
  const chatContainer = eventsDisplay.value;
  if (!chatContainer)
    return;
  chatContainer.scrollTop = chatContainer.scrollHeight;
};

// Functions to format events
const formattedEvents = computed(() => {
  if (currentChannel.value && currentChannel.value.events) {
    return [...currentChannel.value.events.values()].map(event => {
      return new ChatEvent(event);
    });
  }
  return [];
});
watch(formattedEvents, () => {
  if (!isNearBottom())
    return;
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });
const isMessageEvent = (event) => {
  return event.type === EventTypeEnum.MESSAGE;
};
const isTargetEvent = (event) => {
  if (event.type === EventTypeEnum.KICK)
    return true;
  if (event.type === EventTypeEnum.BAN)
    return true;
  if (event.type === EventTypeEnum.UNBAN)
    return true;
  if (event.type === EventTypeEnum.MUTE)
    return true;
  if (event.type === EventTypeEnum.UNMUTE)
    return true;
  return false;
};

// Send message logic
const sendMessage = () => {
  if (newMessage.value.trim() === '')
    return;
  // TODO replace with real client
  client.chanmsg(selectedChannelUUID.value, newMessage.value);
  console.log("Sending message: " + newMessage.value);
  newMessage.value = '';
};

// Click handlers
const onClick = (selected, item) => {
  if (selected instanceof ChatEvent) {
    console.log(`Clicked on event '${item.sourceNickname}'`);
  } else if (selected instanceof ChannelUser) {
    console.log(`Clicked on user '${item.nickname}'`);
  } else {
    console.log(`ERROR: Clicked on item '${item}' not handled`);
  }
};
const onRightClick = (selected, item, event) => {
  event.preventDefault(); // Prevent the default context menu
  contextMenuItem.value = item;

  contextChannelUUID.value = null;
  contextEventUUID.value = null;
  contextUserUUID.value = null;

  // TODO create the array of options based on our permissions and user permissions
  if (selected instanceof ChatEvent || selected instanceof ChannelUser) {
    if (selected instanceof ChatEvent)
      contextEventUUID.value = selected.uuid;
    else
      contextUserUUID.value = selected.uuid;
    contextMenuOptions.value = [
      'Profile',
      'Mute',
      'Block',
      'Ban',
      'Kick',
    ]
  } else if (selected instanceof Channel) {
    contextChannelUUID.value = selected.uuid;
    contextMenuOptions.value = [
      'Edit',
      'Destroy',
      'Leave',
    ]
  } else {
    console.log(`ERROR: Right click on item '${item}' not handled`);
  }

  contextMenuPosition.value = { x: event.clientX, y: event.clientY };
  showContextMenu.value = true;
};

// Context menu
const handleContextMenuSelect = ({ option, item }) => {
  if (['Kick',
       'Ban',
       'Unban',
       'Block',
       'Unblock',
       'Destroy',
       'Leave'].includes(option)) {
    confirmModalTitle.value = `Confirm ${option.toLowerCase()}`;
    confirmModalText.value = `Are you sure you want to ${option.toLowerCase()} '${item.name}'?`;
    showConfirmModal.value = true;
    contextAction.value = option;
  } else {
    executeContextAction(option, item);
  }
}
const handleConfirmModalConfirm = () => {
  executeContextAction(contextAction.value, contextMenuItem.value);
  showConfirmModal.value = false;
};
const executeContextAction = ( option, item ) => {
  // TODO replace for rnavarre action functions
  if (item instanceof Channel) {
    let channelUUID = item.id;
    if (option === 'Edit') {
      console.log(`Editing channel '${item.name}'`);
      handleEditClick();
    } else if (option === 'Destroy') {
      console.log(`Destroying channel '${item.name}'`);
      client.close(item.id);
    } else if (option === 'Leave') {
      console.log(`Leaving channel '${item.name}'`);
      client.part(item.id);
    }
  } else if (item instanceof ChannelUser || item instanceof User) {
    let userUUID = item.id;
    if (option === 'Profile') {
      console.log(`Showing profile for user '${item.nickname}'`);
    } else if (option === 'Mute') {
      console.log(`Muting user '${item.nickname}'`)
      client.mute(selectedChannelUUID.value, item.id);
    } else if (option === 'Block') {
      console.log(`Blocking user '${item.nickname}'`)
      client.block(item.id);
    } else if (option === 'Ban') {
      console.log(`Banning user '${item.nickname}'`)
      client.ban(selectedChannelUUID.value, item.id);
    } else if (option === 'Kick') {
      console.log(` icking user '${item.nickname}'`)
      client.kick(selectedChannelUUID.value, item.id);
    }
  } else {
    console.log(`ERROR: Option '${option}' selected for item '${item}' not handled`);
  }
  closeContextMenu();
};
const closeContextMenu = () => {
  contextEventUUID.value = null;
  contextChannelUUID.value = null;
  contextUserUUID.value = null;

  showContextMenu.value = false;
};

// Modals
const handleJoinClick = () => {
  client.list();
  showJoinModal.value = true;
};
const handleCreateClick = () => {
  showCreateModal.value = true;
};
const handleEditClick = () => {
  showEditModal.value = true;
};

const handleJoinModalSelect = (channel) => {
  console.log(`Joining channel: '${channel.name}', has password? '${channel.hasPassword}', password: '${channel.password}'`);
  client.join(channel.id, channel.hasPassword ? channel.password : undefined);
  showJoinModal.value = false;
};
const handleCreateModalCreate = (channelOptions) => {
  console.log(`Creating channel: '${channelOptions.name}', has password? '${channelOptions.hasPassword}', password: '${channelOptions.password}'`);
  client.create(channelOptions.name, channelOptions.hasPassword ? channelOptions.password : undefined);
  showCreateModal.value = false;
};
const handleEditModalSave = (channelOptions) => {
  console.log(`Editing channel: has password? '${channelOptions.hasPassword}', password: '${channelOptions.password}'`);
  client.password(selectedChannelUUID, channeloptions.hasPassword ? channelOptions.password : undefined);
  showEditModal.value = false;
};

const handleJoinModalClose = () => {
  showJoinModal.value = false;
};
const handleCreateModalClose = () => {
  showCreateModal.value = false;
};
const handleEditModalClose = () => {
  showEditModal.value = false;
};

// Resize functions
const MIN_WIDTH = 100;
const handleResize = (leftSection, middleSection, rightSection, contentSection) => {
  const totalWidth = contentSection.offsetWidth;
  let newLeftWidth = leftSection.offsetWidth;
  let newMiddleWidth = middleSection.offsetWidth;
  let newRightWidth = rightSection.offsetWidth;

  newRightWidth = Math.max(totalWidth - newLeftWidth - newMiddleWidth, MIN_WIDTH);
  newLeftWidth = Math.max(totalWidth - newMiddleWidth - newRightWidth, MIN_WIDTH);
  newMiddleWidth = totalWidth - newLeftWidth - newRightWidth - (resizerWidth.value * 2);

  leftSection.style.width = `${newLeftWidth}px`;
  middleSection.style.width = `${newMiddleWidth}px`;
  rightSection.style.width = `${newRightWidth}px`;
}
const initDrag = (e, leftSection, middleSection, rightSection, contentSection, isLeftResizer) => {
  e.preventDefault();
  const startX = e.clientX;
  const startLeftWidth = leftSection.offsetWidth;
  const startMiddleWidth = middleSection.offsetWidth;
  const startRightWidth = rightSection.offsetWidth;
  const totalWidth = contentSection.offsetWidth;

  const doDrag = (e) => {
    e.preventDefault();
    const deltaX = e.clientX - startX;

    let newLeftWidth = startLeftWidth;
    let newMiddleWidth = startMiddleWidth + (resizerWidth.value * 2);
    let newRightWidth = startRightWidth;
    if (isLeftResizer) {
      newLeftWidth += deltaX;
      newMiddleWidth -= deltaX;
      if (newMiddleWidth <= MIN_WIDTH)
        return;
      if (newLeftWidth <= MIN_WIDTH)
        return;
    } else {
      newMiddleWidth += deltaX;
      newRightWidth -= deltaX;
      if (newMiddleWidth <= MIN_WIDTH)
        return;
      if (newRightWidth <= MIN_WIDTH)
        return;
    }

    // Error correction to ensure the sides are not smaller than the minimum width
    newRightWidth = Math.max(totalWidth - newLeftWidth - newMiddleWidth, MIN_WIDTH);
    newLeftWidth = Math.max(totalWidth - newMiddleWidth - newRightWidth, MIN_WIDTH);
    newMiddleWidth = totalWidth - newLeftWidth - newRightWidth - (resizerWidth.value * 2);

    leftSection.style.width = `${newLeftWidth}px`;
    middleSection.style.width = `${newMiddleWidth}px`;
    rightSection.style.width = `${newRightWidth}px`;
  };

  const stopDrag = () => {
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
};

// Channels and Users colors
function channelClass(channel) {
  if (channel.hasPassword)
    return 'channel-passwd';
  return '';
}
function userClass(user) {
  if (user.isBanned)
    return 'user-banned';
  /*if (user.isOwner) TODO
    return 'user-owner';*/
  if (user.isAdmin)
    return 'user-admin';
  if (user.isFriend)
    return 'user-friend';
  if (user.isMuted)
    return 'user-muted';
  return '';
}
function userStatus(status) {
  if (status === UserStatusEnum.ONLINE)
    return 'status-online';
  if (status === UserStatusEnum.INGAME)
    return 'status-dnd';
  if (status === UserStatusEnum.AWAY)
    return 'status-away';
  return 'status-offline';
}

const randomSeed = Math.floor(Math.random() * 100);
const colors = [
  '#ac2847',
  '#ec273f',
  '#de5d3a',
  '#f3a833',
  '#ce9248',
  '#e8d282',
  '#f7f3b7',
  '#26854c',
  '#5ab552',
  '#9de64e',
  '#62a477',
  '#3388de',
  '#36c5f4',
  '#6dead6',
  '#9a4d76',
  '#c878af',
  '#cc99ff',
  '#fa6e79',
  '#ffa2ac',
  '#ffd1d5',
];
const stringToColor = (str) => {
  let hash = randomSeed;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[(Math.abs(hash) * randomSeed) % colors.length];
};
</script>

<style scoped>
:root {
  --resizer-width: 5px;
}

.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  justify-content: center;
  /*margin: 20px;*/
  color: white;
  background-color: #131313;
  box-sizing: border-box;
}

.content {
  display: flex;
  flex-grow: 1; /* Take up remaining space */
  width: 100%;
  box-sizing: border-box; /* Do not include padding/border in width */
  overflow: hidden;
}

.scrollable-content {
  flex-grow: 1; /* Take up remaining space */
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: hidden; /* Disable horizontal scrolling */
}

.resizer {
  flex: none;
  width: var(--resizer-width);
  cursor: ew-resize;
  background-color: #444;
}

.section {
  display: flex;
  flex-direction: column;
  flex: none;
  overflow: hidden;
}
.section p {
  padding-left: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
}

/*.section-header h2 {
  margin-right: 20px;
}*/

.channels-section {
  flex: none;
  width: 27%;
}
.events-section {
  flex: none;
  width: calc(55% - (var(--resizer-width) * 2));
}
.users-section {
  flex: none;
  width: 18%;
}

.list {
  flex-grow: 1;
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.list li {
  cursor: pointer;
  padding: 0.5em;
  border-bottom: 1px solid #444;
}
.list li:hover {
  background-color: #444;
}

.selected {
  background-color: #444;
}

.message-input {
  display: flex;
  padding: 10px;
  align-items: center;
}
.message-input input[type="text"] {
  flex-grow: 1;
  margin-right: 10px;
  padding: 0.5em;
  color: white;
  background-color: #131313;
  border: 2px solid #444;
}
.message-input button {
  padding: 0.5em 1em;
  cursor: pointer;
  background-color: #444;
  color: white;
  border: none;
}
.message-input button:hover {
  background-color: #555;
}

h1, h2, div {
  color: var(--text-color, white);
}

.event {
  padding: 0.5em;
}
.event:hover {
  background-color: #444;
}
.event-user {
  cursor: pointer;
}
.event-user:hover {
  text-decoration: underline;
}

/* TODO colorines para cada usuario uwu */
.message {
  color: green;
}

.other-event {
  color: gray;
}

.buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}
.buttons button {
  background-color: #444;
  color: white;
  border: none;
  padding: 0.5em  1em;
  margin: 0.5em;
  cursor: pointer;
}
.buttons button:hover {
  background-color: #555;
}

.channel-passwd {
  color: #ff595e;
}

.user-muted {
  color: #707070;
}
.user-banned {
  color: #ff595e;
}
.user-admin {
  color: #ffca3a;
}
.user-owner {
  color: #8ac926;
}
.user-friend {
  color: #1982c4;
}

.status-online {
  color: #8ac926;
}
.status-dnd {
  color: #ff595e;
}
.status-away {
  color: #ffca3a;
}
.status-offline {
  color: #707070;
}
/* #ff595e #ffca3a #8ac926 #1982c4 #6a4c93 palette */
</style>
