<template>
  <q-dialog v-model="internalValue" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">{{ isRegisterMode ? '註冊' : '登入' }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input v-model="form.username" label="使用者名稱" outlined dense autofocus />
        <q-input
          v-if="!isForgotMode && !isRegisterMode"
          v-model="form.password"
          label="密碼"
          type="password"
          outlined
          dense
        />
        <q-input
          v-if="isRegisterMode"
          v-model="form.password"
          label="密碼"
          type="password"
          outlined
          dense
        />
        <q-input
          v-if="isRegisterMode"
          v-model="form.confirmPassword"
          label="確認密碼"
          type="password"
          outlined
          dense
        />
      </q-card-section>

      <q-card-actions align="left" class="q-pt-none" v-if="!isRegisterMode && !isForgotMode">
        <q-btn flat color="grey" label="忘記密碼？" @click="enterForgotMode" />
      </q-card-actions>

      <q-card-actions align="right">
        <q-btn
          flat
          v-if="!isForgotMode"
          :label="isRegisterMode ? '返回登入' : '我要註冊'"
          color="primary"
        />
        <q-btn flat v-else label="返回登入" color="primary" @click="exitForgotMode" />
        <q-btn flat label="取消" color="primary" @click="cancel" />
        <q-btn
          flat
          :label="isRegisterMode ? '註冊' : isForgotMode ? '送出' : '登入'"
          color="primary"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'login', value: { username: string; password: string }): void;
  (e: 'register', value: { username: string; password: string }): void;
  (e: 'forgotPassword', value: { username: string }): void;
}>();

const internalValue = ref(props.modelValue);
const isRegisterMode = ref(false); // ✅ 模式切換：登入 / 註冊
const isForgotMode = ref(false); // 忘記密碼

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
});

watch(
  () => props.modelValue,
  (val) => {
    internalValue.value = val;
  },
);
watch(internalValue, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    resetForm();
  }
});

function resetForm() {
  form.value.username = '';
  form.value.password = '';
  form.value.confirmPassword = '';
  isRegisterMode.value = false;
  isForgotMode.value = false;
}

function enterForgotMode() {
  isForgotMode.value = true;
  isRegisterMode.value = false;
  form.value.password = '';
  form.value.confirmPassword = '';
}

function exitForgotMode() {
  isForgotMode.value = false;
}

function cancel() {
  internalValue.value = false;
  isForgotMode.value = false;
}

function submit() {
  if (isForgotMode.value) {
    emit('forgotPassword', { username: form.value.username });
    internalValue.value = false;
    isForgotMode.value = false;
    return;
  }

  if (isRegisterMode.value) {
    if (form.value.password !== form.value.confirmPassword) {
      alert('密碼與確認密碼不一致');
      return;
    }
    emit('register', {
      username: form.value.username,
      password: form.value.password,
    });
  } else {
    emit('login', {
      username: form.value.username,
      password: form.value.password,
    });
  }

  internalValue.value = false;
}
</script>
