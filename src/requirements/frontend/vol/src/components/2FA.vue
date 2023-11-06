<script setup lang="ts">
import { ref, defineProps } from "vue";
import router from "@/router";
import Toast from "@/components/Toast.vue";

const qr2fa = ref<string | undefined>(undefined);
const enable2fa = ref(!document.cookie.includes("_2fa="));
const secret2fa = ref<string | undefined>(undefined);
const form = ref<string | undefined>(undefined);
const emit = defineEmits(["close2fa"]);
const error = ref<string | undefined>(undefined);

const props = defineProps({
    hasParent: Boolean
});

const toggle2fa = async (code: string) => {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me/2fa`, {
            credentials: "include",
            method: enable2fa.value || !props.hasParent ? "POST" : "DELETE",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                secret: secret2fa.value,
                code: code,
            }),
        });

        if (response.ok) {
            enable2fa.value = !enable2fa.value;
            close(undefined)
            return;
        }

        const { message } = await response.json();

        if (message) {
            throw message;
        }
        throw "Error";
    } catch (e) {
        console.log(e);
        console.log('Ha fallao', error.value);
        error.value = e;
        console.log('Ha fallao', error.value);
    }
};

const close = (e: Event | undefined) => {
    if (!props.hasParent) {
        router.replace("/");
    }
    if (e) {
        e.preventDefault();
    }
    emit("close2fa");
};

const submit = () => {
    console.log("submit");
    console.log(form.value);
    toggle2fa(form.value);
}

const clearError = () => {
    error.value = undefined;
    console.log({ error });
};

(async () => {
    if (!enable2fa.value || !props.hasParent) {
        return;
    }
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/2fa/qr`, {
            credentials: "include",
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const data = await response.json();
            qr2fa.value = data.qr;
            secret2fa.value = data.secret;
        }
    } catch (e) {
        console.log(e);
    }
})();

</script>


<template>
    <section>
        <Toast v-if="error" :error-message="error" @closeToast="clearError">
            <i class="material-icons">error</i>
        </Toast>
        <main>
            <div>
                <h2>2FA</h2>
                <i class="material-icons" v-if="props.hasParent" @click="close">close</i>
            </div>
            <div>
                <div v-if="qr2fa">
                    <p>Read this QR code with your Authenticator app</p>
                    <img :src="qr2fa" />
                </div>
                <div>
                    <p>Input the 2FA code from the Auth app</p>
                    <input type="text" name="code" v-model="form" placeholder="TOTP Code" />
                    <input type="hidden" name="secret" :value="secret2fa" />
                    <button @click="submit">Submit</button>
                </div>
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
    flex-direction: row;
    align-self: flex-start;
    justify-content: space-around;
    align-items: center;
}

section>main>div:first-child {
    justify-content: space-between;
    margin: 0 1rem;
}

p, i, h2 {
    color: var(--color-text);
}

i {
    cursor: pointer;
}
</style>
