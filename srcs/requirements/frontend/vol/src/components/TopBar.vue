<script setup lang="ts">
import { ref, onMounted } from 'vue'
import md5 from 'md5';
const DROPDOWN_ANIMATION_DURATION: number = 200; // ms

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const bgImage = ref<String>('')

bgImage.value = `url('${import.meta.env.VITE_BACKEND_URL}/public/avatars/${props.user.nickname}.png'),` +
                `url('https://www.gravatar.com/avatar/${md5(props.user.login)}/?d=wavatar')`;

onMounted(() => {
  const profilePic = document.querySelector('.profile__pic') as HTMLDivElement;
  const profilePicContainer = document.querySelector('.profile_pic__container') as HTMLDivElement;
  const dropdown = document.querySelector('.dropdown') as HTMLDivElement;
  let lastHoveredElement: HTMLElement | null = null;

  const animateIn = (e: Event) => {
    dropdown.removeEventListener('mouseenter', animateIn);
    profilePic.removeEventListener('mouseenter', animateIn);
    lastHoveredElement = e.target as HTMLElement;
    dropdown.animate([
      { visibility: 'hidden', opacity: '0', height: '0' },
      { visibility: 'visible', opacity: '1', height: 'calc(4em * 3)' },
    ], {
      duration: DROPDOWN_ANIMATION_DURATION,
      iterations: 1,
      easing: 'ease-in',
      fill: 'forwards'
    });
    setTimeout(() => {
      dropdown.addEventListener('mouseleave', animateOut);
      profilePic.addEventListener('mouseleave', animateOut);
      if (profilePicContainer.matches(':hover') || dropdown.matches(':hover') || profilePic.matches(':hover')) return;
      animateOut(e);
    }, DROPDOWN_ANIMATION_DURATION);
  }
  
  const animateOut = (e: Event) => {
    if (profilePicContainer.matches(':hover')) return;
    if (lastHoveredElement === null) return;
    dropdown.removeEventListener('mouseleave', animateOut);
    profilePic.removeEventListener('mouseleave', animateOut);
    dropdown.animate([
      { visibility: 'visible', opacity: '1', height: 'calc(4em * 3)' },
      { visibility: 'hidden', opacity: '0', height: '0' },
    ], {
      duration: DROPDOWN_ANIMATION_DURATION,
      iterations: 1,
      easing: 'ease-out',
      fill: 'forwards'
    });
    setTimeout(() => {
      dropdown.addEventListener('mouseenter', animateIn);
      profilePic.addEventListener('mouseenter', animateIn);
      lastHoveredElement = null;
      if (!profilePicContainer.matches(':hover') && !dropdown.matches(':hover') && !profilePic.matches(':hover')) return;
      animateIn(e);
    }, DROPDOWN_ANIMATION_DURATION);
  }

  profilePic.addEventListener('mouseenter', animateIn);
  
  dropdown.addEventListener('mouseenter', animateIn);
  
  profilePic.addEventListener('mouseleave', animateOut);

  profilePicContainer.addEventListener('mouseleave', animateOut);

  dropdown.addEventListener('mouseleave', animateOut);
})

</script>

<template>
  <div class="topbar__div">
    <img class="main__logo" src="/42logo.svg" />
    <div class="profile_pic__container">
      <div class="profile__pic">
        <div class="dropdown">
          <ul>
            <li>
              <router-link to="/profile">
                <span class="material-icons">person</span>
                <p>Profile</p>
              </router-link>
            </li>
            <li>
              <router-link to="/settings">
                <span class="material-icons">settings</span>
                <p>Settings</p>
              </router-link>
            </li>
            <li>
              <router-link to="/logout">
                <span class="material-icons">logout</span>
                <p>Logout</p>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topbar__div {
  display: flex;
  width: 100%;
  height: 5em;
  background: var(--topbar-bg-color);
  position: absolute;
  align-self: start;
  justify-content: space-between;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.75);
}

.topbar__div .main__logo {
  width: 5em;
  padding: 20px 0;
}

.topbar__div .profile_pic__container {
  width: 10em;
  display: flex;
  flex-direction: row-reverse;
}

.topbar__div .profile__pic {
  width: calc(5em - 20px);
  height: calc(5em - 20px);
  padding: .7em;
  background: v-bind('bgImage');
  background-position: 50% 10px;
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 50%;
  background-clip: content-box;
}

.dropdown {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1;
  background: var(--navbar-bg-color);
  padding: 0;
  width: 10em;
  box-shadow: -5px 5px 10px -5px rgba(0, 0, 0, 0.75);
  overflow: hidden;
}

.dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dropdown ul li {
  width: 100%;
  height: 4em;
  transition: background-color 0.2s ease-in-out;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dropdown ul li a {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--color-text);
  width: 100%;
  height: 100%;
  padding: 0 1em;
}

.dropdown ul li p {
  flex: 2;
  color: var(--color-text);
}

.dropdown ul li span {
  flex: 1;
}

.dropdown ul li:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.profile__pic:hover .dropdown,
.dropdown:hover {
  visibility: visible;
  opacity: 1;
}
</style>
