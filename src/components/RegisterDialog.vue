<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">註冊</div>
      </q-card-section>

      <VeeForm :validation-schema="schema" :onSubmit="onSubmit" v-slot="{ meta }">
        <q-card-section>
          <Field name="account" v-slot="{ field, errorMessage, meta: m }">
            <q-input
              :label="m.touched && errorMessage ? errorMessage : '帳號'"
              outlined
              dense
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
              :error="m.touched && !!errorMessage"
            />
          </Field>

          <Field name="email" v-slot="{ field, errorMessage, meta: m }">
            <q-input
              :label="m.touched && errorMessage ? errorMessage : '電子郵件'"
              outlined
              dense
              type="email"
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
              :error="m.touched && !!errorMessage"
            />
          </Field>

          <Field name="password" v-slot="{ field, errorMessage, meta: m }">
            <q-input
              :label="m.touched && errorMessage ? errorMessage : '密碼'"
              outlined
              dense
              type="password"
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
              :error="m.touched && !!errorMessage"
              :error-message="m.touched ? errorMessage : ''"
            />
          </Field>

          <Field name="confirmPassword" v-slot="{ field, errorMessage, meta: m }">
            <q-input
              :label="m.touched && errorMessage ? errorMessage : '確認密碼'"
              outlined
              dense
              type="password"
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
              :error="m.touched && !!errorMessage"
              :error-message="m.touched ? errorMessage : ''"
            />
          </Field>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" @click="show = false" />
          <q-btn type="submit" label="註冊" color="primary" :disable="!meta.valid" />
        </q-card-actions>
      </VeeForm>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Form as VeeForm, Field, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useApi } from 'src/composables/axios';
import { useUserStore } from 'src/stores/userStore';
import type { AxiosError } from 'axios';
import { Notify } from 'quasar';

interface RegisterForm {
  account: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// 定義 props 和 emits
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'register', payload: RegisterForm): void;
}>();

// API、Pinia
const { api } = useApi();
const userStore = useUserStore();

// VeeValidate
useForm<RegisterForm>();

// Dialog 開關綁定
const show = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

const schema = yup.object({
  account: yup.string().required('請輸入帳號'),
  email: yup.string().email('請輸入有效的電子郵件').required('請輸入電子郵件'),
  password: yup.string().min(4, '密碼至少 4 碼').required('請輸入密碼'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], '密碼不一致')
    .required('請再次輸入密碼'),
});

const onSubmit = async (values: Record<string, unknown>) => {
  const form = values as unknown as RegisterForm;

  try {
    const res = await api.post('/user/register', {
      account: form.account,
      email: form.email,
      password: form.password,
    });

    const { token, user } = res.data;
    userStore.login(user.account, token, user.role, user.avatar);

    Notify.create({
      type: 'positive',
      message: '註冊成功！歡迎加入 🍉',
      position: 'center',
      timeout: 1500,
    });

    emit('register', form);
    emit('update:modelValue', false);
  } catch (err) {
    const error = err as AxiosError;
    console.error('❌ axios error:', {
      message: error.message,
      code: error.code,
      isAxiosError: error.isAxiosError,
      request: error.request,
      response: error.response,
    });
  }
};
</script>
