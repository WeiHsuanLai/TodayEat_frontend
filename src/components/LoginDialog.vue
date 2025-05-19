<template>
  <q-dialog v-model="internalValue" persistent>
    <q-card style="min-width: 300px">
      <q-card-section>
        <div class="text-h6">登入</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input v-model="form.username" label="使用者名稱" outlined dense autofocus />
        <q-input v-model="form.password" label="密碼" type="password" outlined dense />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="取消" color="primary" @click="cancel" />
        <q-btn flat label="登入" color="primary" @click="submit" />
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
}>();

const internalValue = ref(props.modelValue);
const form = ref({
  username: '',
  password: '',
});

// 外部傳入 modelValue → 同步 internalValue
watch(
  () => props.modelValue,
  (val) => {
    internalValue.value = val;
  },
);

// internalValue 改變 → 通知父元件 & 重置表單
watch(internalValue, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    form.value.username = '';
    form.value.password = '';
  }
});

function submit() {
  emit('login', { ...form.value });
  internalValue.value = false;
}

function cancel() {
  internalValue.value = false;
}
</script>
