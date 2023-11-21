<script setup lang="ts">
import { defineProps } from "vue";

const emit = defineEmits(["closemodal"]);

const props = defineProps({
    title: String,
    text: String,
    onAccept: Function,
    onReject: Function,
});

</script>


<template>
    <section>
        <main>
            <div>
                <h2>{{title}}</h2>
                <p>{{text}}</p>
            </div>
            <div class="response__buttons">
                <button @click="onAccept">Accept</button>
                <button @click="onReject">Reject</button>
            </div>
        </main>
    </section>
</template>


<style scoped>
/* We want to show the section like a card in the middle of the screen */
section {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

section>main {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50em !important;
    height: 30em !important;
    border-radius: 10px;
    padding: 20px;
    box-sizing: border-box;
    background-color: var(--bg-color);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

section>main>div {
    display: flex;
    flex-direction: column;
    align-self: flex-start;
    justify-content: space-around;
    align-items: center;
}

p, h2 {
    color: var(--color-text);
}

.response__buttons {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0 1rem;
    height: 100%;
    flex: 2;
}

button {
    flex: 1;
    margin: 0 1rem;
    height: 2rem;
    background: #ff3232;
    border: none;
    color: var(--color-text);
}

button:hover {
    background: #ff0000;
}

button:first-child {
    background: #00cc00;
}

button:first-child:hover {
    background: #00ff00;
}

</style>
