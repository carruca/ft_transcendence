<script setup lang="ts">
import { defineProps } from "vue";

const emit = defineEmits(["closemodal"]);

const props = defineProps({
    title: String,
    onAccept: Function,
    onReject: Function,
    acceptText: {
        type: String,
        default: "Accept"
    },
    rejectText: {
        type: String,
        default: "Reject"
    }
});

</script>


<template>
    <section>
        <main>
            <div>
                <h2>{{ props.title }}</h2>
                <slot></slot>
            </div>
            <div class="response__buttons">
                <button @click="props.onReject">{{ props.rejectText }}</button>
                <button @click="props.onAccept">{{ props.acceptText }}</button>
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
    border-radius: 15x;
}

section>main {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 25em !important;
    height: 15em !important;
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
    height: 50%;
    flex: 2;
}

button {
    flex: 1;
    margin: 0 1rem;
    height: 2rem;
    background: #8ac926;
    border: none;
    color: #0f0f0f;
    border-radius: 5px;
}

button:hover {
    cursor: pointer;
    background: #90d324;
}

button:first-child {
    background: #ff595e;
}

button:first-child:hover {
    background: #f64d53;
}

</style>
