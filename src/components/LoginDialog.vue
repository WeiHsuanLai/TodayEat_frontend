<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 350px">
      <template v-if="!isResetMode">
        <q-card-section>
          <div class="text-h6">登入</div>
        </q-card-section>
        <VeeForm :validation-schema="schema" :onSubmit="onSubmit" v-slot="{ meta }">
          <q-card-section>
            <Field name="account" v-slot="{ field, errorMessage, meta: fieldMeta }">
              <q-input
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
                :name="field.name"
                :label="fieldMeta.touched && errorMessage ? errorMessage : '帳號'"
                outlined
                dense
                autofocus
                :error="fieldMeta.touched && !!errorMessage"
              />
            </Field>

            <Field name="password" v-slot="{ field, errorMessage, meta: fieldMeta }">
              <q-input
                type="password"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
                :name="field.name"
                :label="fieldMeta.touched && errorMessage ? errorMessage : '密碼'"
                outlined
                dense
                :error="fieldMeta.touched && !!errorMessage"
              />
            </Field>
          </q-card-section>
          <q-card-actions align="between" class="q-px-md">
            <q-btn flat color="primary" @click="toggleResetMode">
              {{ '忘記密碼？' }}
            </q-btn>
            <div class="row q-gutter-x-sm">
              <q-btn flat label="取消" color="primary" @click="show = false" />
              <q-btn type="submit" label="登入" color="primary" :disable="!meta.valid" />
            </div>
          </q-card-actions>
        </VeeForm>
      </template>
      <template v-else>
        <q-card-section>
          <div class="text-h6">忘記密碼</div>
        </q-card-section>
        <VeeForm :validation-schema="schema" :onSubmit="onSubmit" v-slot="{ meta }">
          <q-card-section>
            <Field name="email" v-slot="{ field, errorMessage, meta: fieldMeta }">
              <q-input
                type="email"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
                :name="field.name"
                :label="fieldMeta.touched && errorMessage ? errorMessage : '電子郵件'"
                outlined
                dense
                :error="fieldMeta.touched && !!errorMessage"
              />
            </Field>
          </q-card-section>

          <q-card-actions align="between">
            <q-btn flat color="primary" @click="toggleResetMode">
              {{ '返回登入' }}
            </q-btn>
            <q-btn type="submit" label="確定" color="primary" :disable="!meta.valid" />
          </q-card-actions>
        </VeeForm>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Form as VeeForm, Field, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useApi } from 'src/composables/axios';
import { Notify } from 'quasar';
import { defineEmits } from 'vue';

// props & emits
const props = defineProps<{
  modelValue: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'login', payload: { username: string; token: string; role: string; avatar: string }): void;
}>();

// api
const { api } = useApi();

// 表單型別
interface LoginForm {
  account: string;
  password: string;
}

// form context
useForm<LoginForm>();

// 顯示狀態雙向綁定
const show = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

// 切換登入/重設密碼模式
const isResetMode = ref(false);
const toggleResetMode = () => {
  isResetMode.value = !isResetMode.value;
};

// 顯示對話框時重置為登入模式
watch(
  () => props.modelValue,
  (val) => {
    if (val) isResetMode.value = false;
  },
);

// schema 定義
const schema = computed(() =>
  isResetMode.value
    ? yup.object({
        email: yup.string().email('請輸入有效 Email').required('請填寫 Email'),
      })
    : yup.object({
        account: yup.string().required('請輸入帳號'),
        password: yup.string().min(4, '密碼至少 4 碼').required('請輸入密碼'),
      }),
);

// 提交處理
const onSubmit = async (values: Record<string, unknown>) => {
  if (isResetMode.value) {
    const { email } = values as { email: string };
    console.log('🔄 模擬發送忘記密碼請求:', email);
    Notify.create({
      type: 'info',
      message: `模擬寄送至：${email}`,
      position: 'center',
      timeout: 1500,
    });
    show.value = false;
    return;
  }

  const login = values as unknown as LoginForm;
  try {
    const res = await api.post('/user/login', login);

    Notify.create({
      type: 'warning',
      message: '登入成功',
      position: 'center',
      timeout: 1500,
    });

    emit('login', {
      username: res.data.user.account,
      token: res.data.token,
      role: res.data.user.role,
      avatar: res.data.user.avatar,
    });
    show.value = false;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'response' in err &&
      (err as { response?: { data?: { message?: string } } }).response?.data?.message
    ) {
      const message = (err as { response: { data: { message: string } } }).response.data.message;
      Notify.create({
        type: 'negative',
        message,
        position: 'center',
        timeout: 1000,
      });
    } else {
      Notify.create({
        type: 'negative',
        message: '發生未知錯誤',
      });
      console.error('登入失敗:', err);
    }
  }
};
</script>
