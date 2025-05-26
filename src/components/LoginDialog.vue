<template>
  <q-dialog v-model="internalValue" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">{{ isRegisterMode ? '註冊' : '登入' }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-if="!isForgotMode"
          v-model="account.value.value"
          :error="account.meta.touched && !!account.errorMessage.value"
          :error-message="account.meta.touched ? account.errorMessage.value : ''"
          label="使用者名稱"
          outlined
          dense
          autofocus
        />
        <!-- Email（註冊專用） -->
        <q-input
          v-if="isRegisterMode || isForgotMode"
          v-model="email.value.value"
          :error="email.meta.touched && !!email.errorMessage.value"
          :error-message="email.meta.touched ? email.errorMessage.value : ''"
          label="電子郵件"
          type="email"
          outlined
          dense
        />
        <!-- 密碼 -->
        <q-input
          v-if="!isForgotMode && !isRegisterMode"
          v-model="password.value.value"
          :error="password.meta.touched && !!password.errorMessage.value"
          :error-message="password.meta.touched ? password.errorMessage.value : ''"
          label="密碼"
          type="password"
          outlined
          dense
        />
        <!-- 註冊用密碼 -->
        <q-input
          v-if="isRegisterMode"
          v-model="password.value.value"
          :error="password.meta.touched && !!password.errorMessage.value"
          :error-message="password.meta.touched ? password.errorMessage.value : ''"
          label="密碼"
          type="password"
          outlined
          dense
        />
        <!-- 確認密碼 -->
        <q-input
          v-if="isRegisterMode"
          v-model="passwordConfirm.value.value"
          :error="passwordConfirm.meta.touched && !!passwordConfirm.errorMessage.value"
          :error-message="passwordConfirm.meta.touched ? passwordConfirm.errorMessage.value : ''"
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
          @click="toggleRegisterMode"
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
import { useField, useForm } from 'vee-validate';
import * as yup from 'yup';
import { ref, watch } from 'vue';
import validator from 'validator';

const isRegisterMode = ref(false);
const isForgotMode = ref(false);

const schema = yup.object({
  account: yup.string().when([], {
    is: () => !isForgotMode.value,
    then: (s) =>
      s
        .required('使用者帳號必填')
        .min(4, '帳號長度不符')
        .max(20, '帳號長度不符')
        .test('is-alphanumeric', '帳號格式錯誤', (val) => validator.isAlphanumeric(val || '')),
  }),

  password: yup.string().when([], {
    is: () => !isForgotMode.value,
    then: (s) => s.required('密碼必填').min(4, '密碼長度不符').max(20, '密碼長度不符'),
  }),
  email: yup
    .string()
    .email('電子郵件格式錯誤')
    .when([], {
      is: () => isRegisterMode.value || isForgotMode.value,
      then: (s) => s.required('電子郵件必填'),
    }),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref('password')], '密碼不一致')
    .when([], {
      is: () => isRegisterMode.value,
      then: (s) => s.required('請再次輸入密碼'),
    }),
});

const { handleSubmit } = useForm({
  validationSchema: schema,
  validateOnMount: false,
});

const account = useField<string>('account');
const password = useField<string>('password');
const passwordConfirm = useField<string>('passwordConfirm');
const email = useField<string>('email');

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'login', value: { username: string; password: string }): void;
  (e: 'register', value: { username: string; password: string; email: string }): void;
  (e: 'forgotPassword', value: { email: string }): void;
}>();

const internalValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => (internalValue.value = val),
);
watch(internalValue, (val) => {
  emit('update:modelValue', val);
  if (!val) resetForm();
});

function clearFieldsOnly() {
  account.resetField();
  password.resetField();
  passwordConfirm.resetField();
  email.resetField();
}

// 關閉對話框清空資料
function resetForm() {
  clearFieldsOnly();
  isForgotMode.value = false;
  isRegisterMode.value = false;
}

// 忘記密碼
function enterForgotMode() {
  isForgotMode.value = true;
  isRegisterMode.value = false;
  password.value.value = '';
  passwordConfirm.value.value = '';
}

// 返回登入模式
function exitForgotMode() {
  isForgotMode.value = false;
}

// 關閉 dialog 並重設忘記密碼
function cancel() {
  internalValue.value = false;
  isForgotMode.value = false;
}

function toggleRegisterMode() {
  console.log('切換登入/註冊模式');
  isRegisterMode.value = !isRegisterMode.value;
  isForgotMode.value = false;
  clearFieldsOnly();
}

// 根據當前模式送出資料
const submit = handleSubmit((values) => {
  if (isForgotMode.value) {
    emit('forgotPassword', { email: values.email });
  } else if (isRegisterMode.value) {
    emit('register', {
      username: values.account,
      password: values.password,
      email: values.email,
    });
  } else {
    emit('login', { username: values.account, password: values.password });
  }

  clearFieldsOnly();
  internalValue.value = false;
});
</script>
