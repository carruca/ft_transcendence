<script setup lang="ts">
import { on } from 'events';
import { defineEmits, onMounted, ref } from 'vue';

const props = defineProps({
  user: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    required: true
  },
});

const emit = defineEmits(['close']);

let selectedImage : File;
const profilePicture = ref<String>(props.profileImage);

const imageSet : boolean = ref(false);

function sendChanges() {
  // Add condition if new image has been put or new nickname
  const form = document.querySelector('form') as HTMLFormElement;
  (async () => {
    const formData = new FormData(form);

    if ((formData.get('avatar') as File).size === 0) {
      formData.delete('avatar');
    }
    if (formData.get('nickname') === "") {
      formData.delete('nickname');
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
        method: "PUT",
        credentials: 'include',
        body: formData
      });
      if (!response.ok) {
        showPopup();
        return ;
      }
    }
    catch (error) {
      console.error(error);
    }
    emit('close');
  })();
}

onMounted(() => {
  const nicknameInput = document.querySelector('input[name=nickname]') as HTMLInputElement;
  const submitButton = document.querySelector('.submit') as HTMLInputElement;
  nicknameInput.addEventListener('input', async (event) => {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    if (value.length >= 3 && value.length <= 20) {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/nickname/${value}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include'
      });
      submitButton.disabled = !response.ok;
    } else {
      submitButton.disabled = true;
    }
  });
  const imageInput = document.querySelector('input[name=avatar]') as HTMLInputElement;
  imageInput.addEventListener('change', () => {
    submitButton.disabled = false;
  });
})

function handleImageUpload(event : Event) {
  const file = (event.target as HTMLInputElement).files[0];
  selectedImage = file;
  profilePicture.value = URL.createObjectURL(selectedImage);
  imageSet.value = true;
};

let failedFetch = ref<Boolean>(false);

const showPopup = () => {
  failedFetch.value = true;
};

const hidePopup = () => {
  emit('close');
};

</script>


<template>
  <Teleport to="body">
    <div class="popup" v-if="!failedFetch">
      <div class="popup-box">
        <form>
          <div v-if="!imageSet" class="profile-picture"></div>
          <img v-else :src="profilePicture" class="profile-picture">
          <label for="imageInput" class="custom-file-upload">
            <i class="fas fa-cloud-upload-alt"></i> Change Profile Picture
          </label>
          <label for="nicknameInput">New Nickname:</label>
          <input type="file" id="imageInput" name="avatar" accept="image/png" @change="handleImageUpload">
          <input type="text" id="nicknameInput" name="nickname" minlength="3" maxlength="20">
        </form>
        <button class="fancy-button-green submit" @click="sendChanges" disabled>Confirm changes</button>
        <button class="fancy-button-red" @click="$emit('close')">Cancel</button>
      </div>
    </div>
    <div class="popup-bad" v-else>
      <div class="popup-bad-box">
        <p>Failed to update profile</p>
        <p>Not valid nickname or profile photo</p>
        <button class="fancy-button-green" @click="hidePopup">Ok</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>

.custom-file-upload {
  display: inline-block;
  padding: 10px 20px;
  background-color: #f2f2f2;
  color: #555;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.custom-file-upload i {
  margin-right: 5px;
}

.profile-picture {
  background: v-bind('profilePicture');
  width: 150px;
  height: 150px;
  padding: .7em;
  background-position: 50% 10px;
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 50%;
  background-clip: content-box;
}

.custom-file-upload:hover {
  background-color: #e0e0e0;
}

input[type="file"] {
  display: none;
}

form {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: bold;
  margin-bottom: 8px;
}

input[type="text"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

input[type="text"]:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 4px rgba(0, 123, 255, 0.4);
}

.popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
  background-color: rgba(0, 0, 0, 0.5);
  color: rgb(200, 200, 200);
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-box {
  background: #343434;
  padding: 32px;
}

.popup-bad {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
  background-color: rgba(0, 0, 0, 0.5);
  color: rgb(200, 200, 200);
  display: flex;
  align-items: center;
  justify-content: center;
}

button {
  cursor: pointer;
}

.popup-bad-box {
  background: #670b0b;
  padding: 32px;
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

.submit:disabled {
  background-color: #4e4e4e;
  color: #fff;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

</style>
