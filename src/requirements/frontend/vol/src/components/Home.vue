<script setup lang="ts">
document.addEventListener('DOMContentLoaded', () => {
  const profilePic = document.querySelector('.profile__pic') as HTMLDivElement;
  const dropdown = document.querySelector('.dropdown') as HTMLDivElement;

  profilePic.addEventListener('mouseover', () => {
    dropdown.style.display = 'block';
  });

  dropdown.addEventListener('mouseover', () => {
    dropdown.style.display = 'block';
  });

  profilePic.addEventListener('mouseout', () => {
    dropdown.style.display = 'none';
  });

  dropdown.addEventListener('mouseout', () => {
    dropdown.style.display = 'none';
  });
});

// TODO: Get current user image pic
// TODO: Separate this into components
</script>

<template>
  <div class="main_content">
    <div class="topbar__div">
      <img class="main__logo" src="/42logo.svg" />
      <div class="profile__pic">
        <div class="dropdown">
          <ul>
            <li><router-link to="/profile"><span class="material-icons">person</span>
                <p>Profile</p>
              </router-link></li>
            <li><router-link to="/settings"><span class="material-icons">settings</span>
                <p>Settings</p>
              </router-link></li>
            <li><router-link to="/logout"><span class="material-icons">logout</span>
                <p>Logout</p>
              </router-link></li>
          </ul>
        </div>
      </div>
    </div>
    <nav>
      <ul>
        <li><router-link to="/"><span class="material-icons">home</span></router-link></li>
        <li><router-link to="/game"><span class="material-icons">videogame_asset</span></router-link></li>
        <li><router-link to="/chat"><span class="material-icons">chat</span></router-link></li>
        <li><router-link to="/profile"><span class="material-icons">person</span></router-link></li>
      </ul>
    </nav>
    <main>
      <router-view />
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

nav {
  width: 5.5em;
  height: 100%;
  background: var(--navbar-bg-color);
  display: flex;
  flex-direction: column;
  align-items: center;
}

ul {
  list-style: none;
}

nav ul {
  padding: 5em 0;
  margin: 0;
  width: 100%;
}

nav ul li {
  width: 100%;
  height: 4em;
  transition: background-color 0.2s ease-in-out;
}

nav ul li:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

nav ul li a {
  color: var(--p-color);
  text-decoration: none;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.topbar__div .main__logo {
  width: 5em;
  padding: 20px 0;
}

.topbar__div .profile__pic {
  width: calc(5em - 20px);
  height: calc(5em - 20px);
  padding: .7em;
  background: url('https://cdn.intra.42.fr/users/dbd8f561ffbda9e03719b93f70a6f981/madorna-.jpg');
  /* TODO: Get current user image pic */
  background-size: 90%;
  background-position: 50% 10px;
  background-repeat: no-repeat;
  border-radius: 50%;
  background-clip: content-box;
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

.dropdown {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1;
  background: var(--navbar-bg-color);
  padding: 0;
  width: 10em;
  box-shadow: -5px 5px 10px -5px rgba(0, 0, 0, 0.75);
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
  color: var(--p-color);
  width: 100%;
  height: 100%;
  padding: 0 1em;
}

.dropdown ul li p {
  flex: 2;
  color: var(--p-color);
}

.dropdown ul li span {
  flex: 1;
}

.dropdown ul li:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.profile__pic:hover .dropdown,
.dropdown:hover {
  display: block;
}</style>
