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
              <!-- Channel list -->
              <li
                  v-for="channel in userChannelList"
                  :key="channel.id"
                  @click="selectChannel(channel.id)"
                  @contextmenu="onRightClick(channel, channel, $event)"
                  :class="[ channelClass(channel), { 'selected': channel.id === selectedChannelUUID }, { 'selected': channel.id === contextChannelUUID } ]"
              >
                {{ formatChannelName(channel.name) }}
              </li>
              <!-- Private list -->
              <li
                  v-for="pm in privateList"
                  :key="pm.nickname"
                  @click="selectPrivate(pm.id)"
                  @contextmenu="onRightClick(pm, pm, $event)"
                  :class="[ { 'selected': pm.id === selectedPrivateUUID }, { 'selected': pm.id === contextPrivateID } ]"
              >
                {{ pm.nickname }}
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
          <!-- Channel Events -->
          <div class="list" v-if="userCurrentChannel">
            <!-- <h2>{{ userCurrentChannel.name }}</h2> -->
            <div
                v-for="event in formattedEvents"
                :key="event.id"
                :title="getTime(event.timestamp)"
                :class="[ 'event', { 'other-event': !event.isMessageEvent() }, { 'selected': event.id === contextEventUUID } ]"
                :style="event.isMessageEvent() ? { color: event.color } : {}"
            >
              <span v-if="event.isMessageEvent()">&lt;</span>
              <span v-else>&nbsp;-&nbsp;</span>
              <span
                  class="event-user"
                  :title="getUserTitle(event.sourceChannelUser)"
                  @click="onClick(event, event.sourceChannelUser)" 
                  @contextmenu="onRightClick(event, event.sourceChannelUser, $event)">
                {{ event.source.name }}
              </span>
              <span v-if="event.isMessageEvent()">&gt;</span>
              <span>&nbsp;</span>
              <span>
                {{ event.message }}
              </span>
              <span v-if="event.isTargetEvent()">&nbsp;</span>
              <span
                  v-if="event.isTargetEvent()"
                  class="event-user"
                  :title="getUserTitle(event.targetChannelUser)"
                  @click="onClick(event, event.targetChannelUser)"
                  @contextmenu="onRightClick(event, event.targetChannelUser, $event)">
                {{ event.target.name }}
              </span>
            </div>
          </div>
          <!-- Private Events -->
          <div v-else-if="currentPrivate">
            <!-- <h2>{{ currentPrivate.nickname }}</h2> -->
            <div
                v-for="event in formattedEvents"
                :key="event.id"
                :title="getTime(event.timestamp)"
                :class="[ 'event' ]"
                :style="{ color: event.color }"
            >
              <span>&lt;{{ event.source.name }}&gt;&nbsp;{{ event.message }}</span>
            </div>
          </div>
          <!-- Nothing selected -->
          <div v-else>
            <p>No chat selected.</p>
          </div>
        </div>
        <!-- message input box -->
        <div v-if="userCurrentChannel || currentPrivate" class="message-input">
          <input type="text" v-model="newMessage" ref="messageInput" @keyup.enter="sendMessage" placeholder="Message...">
          <button @click="sendMessage">Send</button>
        </div>
      </div>
      <!-- Resizer between columns -->
      <div class="resizer" ref="rightResizer"></div>
      <!-- Column for User List -->
      <div class="section users-section" ref="rightSection">
        <div class="section-header">
          <h2>Users</h2>
        </div>
        <div class="scrollable-content">
          <div class="user-list" v-if="userCurrentChannel">
            <ul class="list">
              <li
                  v-for="channelUser in userCurrentChannel.users.values()"
                  :key="channelUser.user.id"
                  :title="getUserTitle(channelUser)"
                  :class="{ selected: channelUser.user.id === contextUserUUID }"
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
                    {{ channelUser.user.name }}
                  </span>
                  {{ getUserInfo(channelUser) }}
              </li>
            </ul>
          </div>
          <div v-else-if="currentPrivate">
            <p>You are on a private chat.</p>
          </div>
          <div v-else>
            <p>No channel selected.</p>
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
      :users="userCurrentChannelBanList"
      @pm="handleEditModalPm"
      @unban="handleEditModalUnban"
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
import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  computed,
  nextTick,
} from 'vue';
import router from '@/router';

import contextMenu from '@/components/ContextMenu.vue';
import joinChannelModal from '@/components/JoinChannelModal.vue';
import createChannelModal from '@/components/CreateChannelModal.vue';
import editChannelModal from '@/components/EditChannelModal.vue';
import confirmModal from '@/components/ConfirmModal.vue';
import {
  Channel,
  ChannelUser,
  User,
  Event,
  EventUser,
  ChatEvent,
  Private,
} from '@/services/model';
import { ChatClient } from '@/services/chat-client';
import {
  EventTypeEnum,
  UserSiteRoleEnum,
  UserStatusEnum,
} from '@/services/enum';

const client = ChatClient.getInstance();

const {
  channelsSummary,
  userChannelList,
  userCurrentChannel,
  setUserCurrentChannel,
  userCurrentChannelBanList,
  privateList,
  currentPrivate,
  setCurrentPrivate,
} = client;


const selectedChannelUUID = ref(null);
const selectedPrivateUUID = ref(null);

const contentSection = ref(null);

const leftSection = ref(null);
const rightSection = ref(null);
const middleSection = ref(null);
const leftResizer = ref(null);
const rightResizer = ref(null);

const eventsDisplay = ref(null);
const newMessage = ref('');

const messageInput = ref(null);

// Context menu
const contextChannelUUID = ref(null);
const contextEventUUID = ref(null);
const contextUserUUID = ref(null);
const contextPrivateUUID = ref(null);

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

// Assuming userCurrentChannelBanList is a ref
onMounted(() => {
  window.addEventListener('click', closeContextMenu);
  window.addEventListener('resize', e => handleResize(leftSection.value, middleSection.value, rightSection.value, contentSection.value));
  leftResizer.value.addEventListener('mousedown', e => initDrag(e, leftSection.value, middleSection.value, rightSection.value, contentSection.value, true));
  rightResizer.value.addEventListener('mousedown', e => initDrag(e, leftSection.value, middleSection.value, rightSection.value, contentSection.value, false));
  scrollToBottom();

  updateResizerWidth();

  if (userCurrentChannel.value && userCurrentChannel.value.id != selectedChannelUUID.value) {
    selectedChannelUUID.value = userCurrentChannel.value.id;
    nextTick(() => {
      scrollToBottom();
    });
  }
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

// Watch current channel for change in current channel
watch(userCurrentChannel, (newChannel) => {
  if (!newChannel) {
    selectedChannelUUID.value = undefined;
  } else if (newChannel.id !== selectedChannelUUID.value) {
    selectChannel(newChannel.id);
    nextTick(() => {
      scrollToBottom();
    });
  }
});
// Watch the current private for change in current private
watch(currentPrivate, (newPrivate) => {
  if (!newPrivate) {
    selectedPrivateUUID.value = undefined;
  } else if (newPrivate.id !== selectedPrivateUUID.value) {
    selectPrivate(newPrivate.id);
    nextTick(() => {
      scrollToBottom();
    });
  }
});

// Watch the channel list for deletion of current channel
watch(userChannelList, (newChannelList) => {
  if (selectedChannelUUID.value && !newChannelList.some(channel => channel.id === selectedChannelUUID.value)) {
    selectedChannelUUID.value = undefined;
    setUserCurrentChannel(undefined);
  }
});
// Watch the selectedChannelUUID for changes to its user list
/*watch(
  () => selectedChannelUUID.value ? Array.from(userCurrentChannel.users.values()) : [],
  (newUsersArray) => {
    // Check if selectedUser still exists in the updated users of selectedChannel
    if (selectedUser.value && !newUsersArray.some(user => user.id === selectedUser.value.id)) {
      selectedUser.value = null;
      selectedUserUUID.value = null;
    }
  },
  { deep: true }
);*/

// Define a ref for the resizer width
const resizerWidth = ref(5); // The initial value in px
const updateResizerWidth = () => {
  document.documentElement.style.setProperty('--resizer-width', `${resizerWidth.value}px`);
};

const unselectChannel = () => {
  selectedChannelUUID.value = undefined;
  setUserCurrentChannel(undefined);
};
const unselectPrivate = () => {
  selectedPrivateUUID.value = undefined;
  setCurrentPrivate(undefined);
};

const selectChannel = (channelUUID) => {
  unselectPrivate();
  selectedChannelUUID.value = channelUUID;
  setUserCurrentChannel(channelUUID);
  nextTick(() => {
    messageInput.value.focus();
  });
};
const selectPrivate = (privateUUID) => {
  unselectChannel();
  selectedPrivateUUID.value = privateUUID;
  setCurrentPrivate(privateUUID);
  nextTick(() => {
    messageInput.value.focus();
  });
};

const getTime = (time) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const dayOfWeek = days[time.getDay()];
  const dayOfMonth = time.getDate();
  const month = months[time.getMonth()];
  const year = time.getFullYear();
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const ordinal = ((dayOfMonth) => {
    if (dayOfMonth > 3 && dayOfMonth < 21) return 'th';
    switch (dayOfMonth % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  })(dayOfMonth);

  return `${dayOfWeek} ${dayOfMonth}${ordinal} ${month} ${year} ${hours}:${minutes}:${seconds}`;
};

// Uncomment and adapt the watch statement if needed
// watch(userChannelList, (newChannels, oldChannels) => {
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
function formatChannelName(name) {
  return name.startsWith('#') ? `# ${name.substring(1)}` : `# ${name}`;
}
const formattedEvents = computed(() => {
  if (userCurrentChannel.value && userCurrentChannel.value.events) {
    return [...userCurrentChannel.value.events.values()].map(event => {
      const sourceChannelUser = client.getChannelUserById(selectedChannelUUID.value, event.source.id);
      const targetChannelUser = event.target ? client.getChannelUserById(selectedChannelUUID.value, event.target.id) : undefined;
      return new ChatEvent(event, sourceChannelUser, targetChannelUser);
    });
  }
  if (currentPrivate.value && currentPrivate.value.events) {
    return [...currentPrivate.value.events.values()].map(event => {
      return new ChatEvent(event, undefined, undefined);
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

// Send message logic
const sendMessage = () => {
  if (newMessage.value.trim() === '')
    return;
  console.log("Sending message: " + newMessage.value);
  if (userCurrentChannel.value)
    client.chanmsg(selectedChannelUUID.value, newMessage.value);
  if (currentPrivate.value)
    client.privmsg(currentPrivate.value.id, newMessage.value);
  newMessage.value = '';
};

// Click handlers
const onClick = (selected, item) => {
  // Protect in case user is no longer on the channel (item/ChannelUser is undefined)
  if (selected instanceof ChatEvent && !item) {
    if (selected.isTargetEvent())
      item = selected.target;
    else
      item = selected.source;
    // Ourself?
    if (item.id === client.me.value.id)
      return;
    client.openPrivate(item.id, item.name);
  } else if (selected instanceof ChatEvent || selected instanceof ChannelUser) {
    // Ourself?
    if (item.user.id === client.me.value.id)
      return;
    client.openPrivate(item.user.id, item.user.name);
  } else {
    console.log(`ERROR: Clicked on item '${item}' not handled`);
  }
};
const onRightClick = (selected, item, event) => {
  event.preventDefault(); // Prevent the default context menu

  contextChannelUUID.value = null;
  contextEventUUID.value = null;
  contextUserUUID.value = null;
  contextPrivateUUID.value = null;

  // Protect in case user is no longer on the channel (item/ChannelUser is undefined)
  if (selected instanceof ChatEvent && !item) {
    if (selected.isTargetEvent())
      item = selected.target;
    else
      item = selected.source;
  }
  getAvailableOptions(selected, item);

  contextMenuItem.value = item;
  contextMenuPosition.value = { x: event.clientX, y: event.clientY };
  showContextMenu.value = true;
};

// Context menu
const getAvailableOptions = (selected, item) => {
  // Set context variables
  if (selected instanceof ChatEvent || selected instanceof ChannelUser) {
    if (selected instanceof ChatEvent)
      contextEventUUID.value = selected.id;
    else
      contextUserUUID.value = selected.id;
  } else if (selected instanceof Channel) {
    contextChannelUUID.value = selected.id;
  } else if (selected instanceof Private) {
    contextPrivateUUID.value = selected.id;
  } else {
    console.log(`ERROR: Right click on item '${item}' not handled`);
  }

  const myUser = client.me.value;
  // If we are right clicking on a channel, get that channel
  // otherwise, get the current selected channel
  const myChannelUser = (() => {
    if (selected instanceof Channel)
      return client.getChannelUserById(contextChannelUUID.value, myUser.id);
    else
      return client.getChannelUserById(selectedChannelUUID.value, myUser.id);
  })();


  // TODO create the array of options based on our permissions and user permissions
  contextMenuOptions.value = [];

  if (selected instanceof Channel) {
    if (myChannelUser.isOwner || myChannelUser.isAdmin) {
      contextMenuOptions.value.push('Edit');
      contextMenuOptions.value.push('Destroy');
    }
    contextMenuOptions.value.push('Leave');
  }

  if (selected instanceof Private) {
    contextMenuOptions.value.push('Profile');

    if (client.getUserById(item.id).blocked)
      contextMenuOptions.value.push('Unblock');
    else
      contextMenuOptions.value.push('Block');

    contextMenuOptions.value.push('Close');
  }

  if (selected instanceof ChatEvent || selected instanceof ChannelUser) {
    // User actions
    contextMenuOptions.value.push('Profile');

    // Protect in case user no longer in channel 
    // (item is EventUser instead of ChannelUser)
    if (item instanceof EventUser)
      return;
    // in case we clicked on ourself!
    if (item.user.id === myUser.id)
      return;

    // Channel user actions
    if (item.user.status === UserStatusEnum.ONLINE)
      contextMenuOptions.value.push('Challenge');
    else if (item.user.status === UserStatusEnum.IN_GAME)
      contextMenuOptions.value.push('Spectate');

    if (item.user.blocked)
      contextMenuOptions.value.push('Unblock');
    else
      contextMenuOptions.value.push('Block');

    if (myChannelUser.isOwner || myChannelUser.isAdmin) {
      // TODO what if target is admin or owner?
      if (myChannelUser.isOwner && item.isAdmin) {
        contextMenuOptions.value.push('Demote');
      } else if (myChannelUser.isOwner) {
        contextMenuOptions.value.push('Promote');
      }

      if (item.isMuted)
        contextMenuOptions.value.push('Unmute');
      else
        contextMenuOptions.value.push('Mute');

      if (item.isBanned)
        contextMenuOptions.value.push('Unban');
      else
        contextMenuOptions.value.push('Ban');

      contextMenuOptions.value.push('Kick');
    }
  }
}
const handleContextMenuSelect = ({ option, item }) => {
  if (['Block',
       'Unblock',
       'Promote',
       'Demote',
       'Ban',
       'Unban',
       'Kick',
       'Destroy',
       'Leave'].includes(option)) {
    confirmModalTitle.value = `Confirm ${option.toLowerCase()}`;

    let name = '';
    if (item instanceof Channel)
        name = item.name;
    else if (item instanceof ChannelUser)
        name = item.user.name;
    confirmModalText.value = `Are you sure you want to ${option.toLowerCase()} '${name}'?`;

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
      client.banList(item.id);
      handleEditClick();
    } else if (option === 'Destroy') {
      console.log(`Destroying channel '${item.name}'`);
      client.close(item.id);
    } else if (option === 'Leave') {
      console.log(`Leaving channel '${item.name}'`);
      client.part(item.id);
    }
  } else if (item instanceof Private) {
    let privateUUID = item.id;
    if (option === 'Profile') {
      router.push(`/profile/${item.nickname}`);
    } else if (option === 'Close') {
      console.log(`Closing private chat with '${item.nickname}'`);
      client.closePrivate(item.id);
    } else if (option === 'Block') {
      console.log(`Blocking user '${item.nickname}'`);
      client.block(item.id);
    } else if (option === 'Unblock') {
      console.log(`Unblocking user '${item.nickname}'`);
      client.unblock(item.id);
    }
  } else if (item instanceof EventUser) {
    if (option === 'Profile') {
      router.push(`/profile/${item.name}`);
    }
  } else if (item instanceof ChannelUser) {
    let userUUID = item.user.id;
    if (option === 'Profile') {
      router.push(`/profile/${item.user.name}`);
    } else if (option === 'Challenge') {
      console.log(`Challenging user '${item.user.name}'`);
      client.challengeRequest(item.user.id);
    } else if (option === 'Spectate') {
      console.log(`Spectating user '${item.user.name}'`);
      client.challengeSpectate(item.user.id);
    } else if (option === 'Mute') {
      console.log(`Muting user '${item.user.name}'`)
      client.mute(selectedChannelUUID.value, item.user.id);
    } else if (option === 'Unmute') {
      console.log(`Unmuting user '${item.user.name}'`)
      client.unmute(selectedChannelUUID.value, item.user.id);
    } else if (option === 'Block') {
      console.log(`Blocking user '${item.user.name}'`)
      client.block(item.user.id);
    } else if (option === 'Unblock') {
      console.log(`Unblocking user '${item.user.name}'`)
      client.unblock(item.user.id);
    } else if (option === 'Ban') {
      console.log(`Banning user '${item.user.name}'`)
      client.ban(selectedChannelUUID.value, item.user.id);
    } else if (option === 'Unban') {
      console.log(`Unbanning user '${item.user.name}'`)
      client.unban(selectedChannelUUID.value, item.user.id);
    } else if (option === 'Promote') {
      console.log(`Promoting user '${item.user.name}'`)
      client.promote(selectedChannelUUID.value, item.user.id);
    } else if (option === 'Demote') {
      console.log(`Demoting user '${item.user.name}'`)
      client.demote(selectedChannelUUID.value, item.user.id);
    } else if (option === 'Kick') {
      console.log(`Kicking user '${item.user.name}'`)
      client.kick(selectedChannelUUID.value, item.user.id);
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
  console.log("selectedChannelUUID", selectedChannelUUID.value);
  client.password(selectedChannelUUID.value, channelOptions.hasPassword ? channelOptions.password : undefined);
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

const handleEditModalPm = (user) => {
  setCurrentPrivate(user.id);
  // TODO set pm logic
};
const handleEditModalUnban = (user) => {
  console.log(`Unbanning user '${user.name}'`)
  client.unban(selectedChannelUUID.value, user.id);
};

// Resize functions
const MIN_WIDTH = 100;
const handleResize = (leftSection, middleSection, rightSection, contentSection) => {
  if (!leftSection || !middleSection || !rightSection || !contentSection)
    return;
  const totalWidth = contentSection.offsetWidth;
  let newLeftWidth = leftSection.offsetWidth;
  let newMiddleWidth = middleSection.offsetWidth;
  let newRightWidth = rightSection.offsetWidth;

  newRightWidth = Math.max(totalWidth - newLeftWidth - newMiddleWidth, MIN_WIDTH);
  newLeftWidth = Math.max(totalWidth - newMiddleWidth - newRightWidth, MIN_WIDTH);
  newMiddleWidth =  -totalWidth - newLeftWidth - newRightWidth - (resizerWidth.value * 2);
  leftSection.style.width = `${newLeftWidth}px`;
  middleSection.style.width = `${newMiddleWidth}px`;
  rightSection.style.width = `${newRightWidth}px`;
}
const initDrag = (e, leftSection, middleSection, rightSection, contentSection, isLeftResizer) => {
  e.preventDefault();
  if (!leftSection || !middleSection || !rightSection || !contentSection)
    return;
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
  if (channel.password)
    return 'channel-passwd';
  return '';
}
function userClass(user) {
  if (user.isBanned)
    return 'user-banned';
  if (user.isOwner)
    return 'user-owner';
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
  if (status === UserStatusEnum.AWAY)
    return 'status-away';
  if (status === UserStatusEnum.IN_GAME)
    return 'status-dnd';
  return 'status-offline';
}

const getUserRoles = (channelUser) => {
  const roles = [];
  if (!channelUser) return roles;
  if (channelUser.user.id === client.me.value.id) roles.push('me');
  if (channelUser.isOwner) roles.push('owner');
  if (channelUser.isAdmin && !channelUser.isOwner) roles.push('admin');
  if (channelUser.isMuted) roles.push('muted');
  if (channelUser.isBanned) roles.push('banned');
  if (channelUser.user.friend) roles.push('friend');
  if (channelUser.user.blocked) roles.push('blocked');
  return roles;
}
const getUserTitle = (channelUser) => {
  if (!channelUser)
    return '(user no longer in channel)';

  const roles = getUserRoles(channelUser);
  if (roles.length === 0)
    return '(none)';
  return `${roles.join(', ')}`;
}
const getUserInfo = (channelUser) => {
  if (!channelUser)
    return '(user no longer in channel)';

  const roles = getUserRoles(channelUser);
  if (roles.length === 0)
    return '';
  return roles.map(role => `(${role})`).join(' ');
}
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
