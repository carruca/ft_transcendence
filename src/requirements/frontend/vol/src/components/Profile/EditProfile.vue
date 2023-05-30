<script setup lang="ts">
import { defineEmits, ref } from 'vue';


const emit = defineEmits(['close']);

let selectedImage;
const profilePicture = ref('https://cdn.intra.42.fr/users/948cb22973cf3c85d827011190ca2aaa/tsierra-.jpg');

const newNickname = ref('');

function sendChanges() {
	// Add condition if new image has been put or new nickname
	emit('close');
}

function handleImageUpload(event : Event) {
	const file = event?.target?.files[0];//I dont understand why this works nor wtf is this
	selectedImage = file;
  profilePicture.value = URL.createObjectURL(selectedImage);
}

async function uploadImage() {
	// try {
	// 	await fetch('${import.meta.env.VITE_BACKEND_URL}', {
	// 		method: "POST",
	// 		headers?: {
	
	// 		},
	// 	})
	// } catch (error) {
	// 	console.error('Error POSTing data:', error);
	// }
	
}

</script>


<template>
	<Teleport to="body">
		<div class="popup">
			<div class="popup-box">
				<div>
					<form>
						<img :src="profilePicture" alt="Profile Picture" class="profile-picture">
						<label for="imageInput" class="custom-file-upload">
							<i class="fas fa-cloud-upload-alt"></i> Choose Profile Picture
						</label>
						<input type="file" id="imageInput" accept="image/*" @change="handleImageUpload">
					</form>
				</div>

				<div class="nickname">
					<!-- form is not good, recharge page and thats forbidden -->
					<form action="#">
						<label for="nicknameInput">New Nickname:</label>
						<input type="text" id="nicknameInput" name="nickname" required>
					</form>
				</div>

				<button class="fancy-button-green" @click="sendChanges">Confirm changes</button>
				<button class="fancy-button-red" @click="$emit('close')">Cancel</button>
			</div>
		</div>
	</Teleport>
</template>

<style>

.custom-file-upload {
  display: inline-block;
  padding: 10px 20px;
  background-color: #f2f2f2;
  color: #555;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.custom-file-upload:hover {
  background-color: #e0e0e0;
}

.custom-file-upload i {
  margin-right: 5px;
}

.profile-picture {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 10px;
}

.custom-file-upload {
  display: inline-block;
  padding: 10px 20px;
  background-color: #f2f2f2;
  color: #555;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.custom-file-upload:hover {
  background-color: #e0e0e0;
}

.custom-file-upload i {
  margin-right: 5px;
}

/* Style the file input to be hidden */
input[type="file"] {
  display: none;
}

/* */

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

/*  */

.nickname {
	margin-bottom: 30px;
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