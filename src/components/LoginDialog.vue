<!-- src/components/LoginDialog.vue - 登入彈窗 -->
<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 380px; min-height: 200px; max-height: 90vh; overflow: hidden">
      <template v-if="!isResetMode">
        <q-card-section>
          <div class="text-h6">{{ t('loginTitle') }}</div>
        </q-card-section>
        <VeeForm :validation-schema="schema" :onSubmit="onSubmit">
          <q-card-section>
            <Field name="account" v-slot="{ field, errorMessage, meta: fieldMeta }">
              <q-input
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
                :name="field.name"
                :label="fieldMeta.touched && errorMessage ? errorMessage : t('account')"
                outlined
                dense
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
                :label="fieldMeta.touched && errorMessage ? errorMessage : t('password')"
                outlined
                dense
                :error="fieldMeta.touched && !!errorMessage"
              />
            </Field>
            <Field name="captcha" v-slot="{ field, errorMessage, meta: fieldMeta }">
              <div class="flex items-center" style="flex: 1">
                <q-input
                  class="full-width"
                  v-model="captchaInputValue"
                  @update:model-value="field.onChange"
                  @blur="field.onBlur"
                  :name="field.name"
                  :label="fieldMeta.touched && errorMessage ? errorMessage : t('captcha')"
                  outlined
                  dense
                  :error="fieldMeta.touched && !!errorMessage"
                />
                <img
                  :src="captchaUrl"
                  crossorigin="use-credentials"
                  @click="refreshCaptcha"
                  style="
                    cursor: pointer;
                    height: 40px;
                    width: 100px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    display: block;
                  "
                  :alt="t('captchaAlt')"
                />
                <q-btn
                  dense
                  flat
                  color="primary"
                  icon="refresh"
                  size="lg"
                  @click="refreshCaptcha"
                  :aria-label="t('refreshCaptcha')"
                  class="q-mt-xs"
                />
              </div>
            </Field>
          </q-card-section>
          <q-card-actions align="between" class="q-px-md">
            <q-btn flat color="primary" @click="toggleResetMode">
              {{ t('forgotPassword') }}
            </q-btn>
            <div class="row q-gutter-x-sm">
              <q-btn flat :label="t('cancel')" color="primary" @click="show = false" />
              <q-btn type="submit" :label="t('login')" color="primary" />
            </div>
          </q-card-actions>
          <div
            id="google-login-button"
            class="q-pa-none full-width flex flex-center"
            style="min-height: 80px; width: 300px"
          />
        </VeeForm>
      </template>
      <template v-else>
        <q-card-section>
          <div class="text-h6">{{ t('forgotPasswordTitle') }}</div>
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
                :label="fieldMeta.touched && errorMessage ? errorMessage : t('email')"
                outlined
                dense
                :error="fieldMeta.touched && !!errorMessage"
              />
            </Field>
          </q-card-section>

          <q-card-actions align="between">
            <q-btn flat color="primary" @click="toggleResetMode">
              {{ t('backToLogin') }}
            </q-btn>
            <q-btn type="submit" :label="t('confirm')" color="primary" :disable="!meta.valid" />
          </q-card-actions>
        </VeeForm>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { Form as VeeForm, Field, useForm } from 'vee-validate';
import { userApi } from 'src/api';
import { Notify } from 'quasar';
import z from 'zod';
import { toTypedSchema } from '@vee-validate/zod';

const { t } = useI18n();
const form = useForm();
form.resetForm({
  values: {
    account: '',
    password: '',
    captcha: '',
  },
});

// Google 登入相關設定
const GOOGLE_CLIENT_ID = '14982398097-cti2fv3589qi59hfgdnu1mfrauvpnt9k.apps.googleusercontent.com';

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-sdk')) {
      resolve(); // 已載入
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.id = 'google-sdk';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google SDK 載入失敗'));
    document.head.appendChild(script);
  });
}

function handleGoogleLogin(response: google.accounts.id.CredentialResponse) {
  if (!response || !response.credential) {
    Notify.create({ type: 'negative', message: t('googleLoginFailed') });
    return;
  }
  const credential = response.credential;
  // console.log('✅ Google JWT Token:', credential);

  // 傳到後端驗證
  userApi
    .googleLogin({ token: credential })
    .then((res) => {
      emit('login', {
        username: res.data.user.account,
        token: res.data.token,
        role: res.data.user.role as number,
        avatar: res.data.user.avatar,
        loginType: res.data.loginType,
      });
      show.value = false;
    })
    .catch((err) => {
      Notify.create({ type: 'negative', message: t('googleLoginFailed') });
      console.error(err);
    });
}

function initGoogleSignIn() {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin,
      auto_select: false,
      cancel_on_tap_outside: false,
      context: 'signin',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)._gsiInited = true;
  }
}

onMounted(async () => {
  await loadGoogleScript();
  initGoogleSignIn();
});

// props & emits
const props = defineProps<{
  modelValue: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (
    e: 'login',
    payload: {
      username: string;
      token: string;
      role: number;
      avatar: string;
      loginType: 'normal' | 'google';
    },
  ): void;
}>();

// api
const captchaUrl = ref(import.meta.env.VITE_API + 'auth/captcha?t=' + Date.now());

const refreshCaptcha = () => {
  captchaUrl.value = import.meta.env.VITE_API + 'auth/captcha?t=' + Date.now();
};

// 表單型別
interface LoginForm {
  account: string;
  password?: string;
  captcha?: string;
}

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

const captchaInputValue = ref('');
watch(captchaInputValue, (val) => {
  form.setFieldValue('captcha', val);
});

// 顯示對話框時重置為登入模式
watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      // 重置表單與驗證碼
      isResetMode.value = false;
      captchaInputValue.value = '';
      form.resetForm({
        values: {
          account: '',
          password: '',
          captcha: '',
        },
      });
      refreshCaptcha();

      // 等待 Dialog 動畫與 DOM 掛載
      await nextTick();
      const el = document.getElementById('google-login-button');
      if (el && window.google?.accounts?.id) {
        // 確保初始化
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(window as any)._gsiInited) {
          initGoogleSignIn();
        }

        el.innerHTML = '';
        window.google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          width: '300px',
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    }
  },
);

// 使用 Zod 定義驗證規則
const isAccountRequired = computed(() => !isResetMode.value);
const isPasswordRequired = computed(() => !isResetMode.value);
const isEmailValid = computed(() =>
  isResetMode.value
    ? z.string({ required_error: t('pleaseEnterEmail') }).email(t('invalidEmail'))
    : z.string(),
);

// 帳號驗證規則
const isAccountValid = computed(() =>
  isAccountRequired.value
    ? z
        .string({ required_error: t('pleaseEnterAccount') })
        .nonempty(t('pleaseEnterAccount'))
        .min(4, { message: t('accountTooShort') })
    : z.string(),
);

// 密碼驗證規則
const isPasswordValid = computed(() =>
  isPasswordRequired.value
    ? z
        .string({ required_error: t('pleaseEnterPassword') })
        .min(4, { message: t('passwordTooShortLogin') })
    : z.string(),
);

// 驗證碼驗證規則
const isCaptchaRequired = computed(() =>
  z.string({ required_error: t('pleaseEnterCaptcha') }).nonempty(t('pleaseEnterCaptcha')),
);

const schema = computed(() =>
  toTypedSchema(
    isResetMode.value
      ? z.object({
          email: isEmailValid.value,
        })
      : z.object({
          account: isAccountValid.value,
          password: isPasswordValid.value,
          captcha: isCaptchaRequired.value,
        }),
  ),
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
    const res = await userApi.login(login);

    Notify.create({
      type: 'positive',
      message: t('loginSuccess'),
      position: 'center',
      timeout: 1500,
    });

    emit('login', {
      username: res.data.user.account,
      token: res.data.token,
      role: res.data.user.role as number,
      avatar: res.data.user.avatar,
      loginType: res.data.loginType || 'normal',
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

      // 如果是驗證碼錯誤，重新載入驗證碼
      if (message.includes('驗證碼錯誤') || message.includes('captcha')) {
        refreshCaptcha();
        captchaInputValue.value = '';
        console.log('🔄 驗證碼錯誤，重新載入驗證碼', captchaInputValue.value);
      }
      Notify.create({
        type: 'negative',
        message,
        position: 'center',
        timeout: 1000,
      });
    } else {
      Notify.create({
        type: 'negative',
        message: t('unknownError'),
      });
      console.error('登入失敗:', err);
    }
  }
};
</script>
