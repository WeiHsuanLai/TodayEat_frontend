<!-- src/components/RegisterDialog.vue - 註冊彈窗 -->
<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">{{ t('registerTitle') }}</div>
      </q-card-section>

      <VeeForm :validation-schema="schema" :onSubmit="onSubmit" v-slot="{ meta }">
        <q-card-section>
          <Field name="account" v-slot="{ field, errorMessage, meta: m }">
            <q-input
              :label="m.touched && errorMessage ? errorMessage : t('account')"
              outlined
              dense
              autofocus
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
              :error="m.touched && !!errorMessage"
            />
          </Field>

          <Field name="email" v-slot="{ field, errorMessage, meta: m }">
            <q-input
              :label="m.touched && errorMessage ? errorMessage : t('email')"
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
              :label="m.touched && errorMessage ? errorMessage : t('password')"
              outlined
              dense
              type="password"
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
              :error="m.touched && !!errorMessage"
            />
          </Field>

          <Field name="confirmPassword" v-slot="{ field, errorMessage, meta: m }">
            <q-input
              :label="m.touched && errorMessage ? errorMessage : t('confirmPassword')"
              outlined
              dense
              type="password"
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
              :error="m.touched && !!errorMessage"
            />
          </Field>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t('cancel')" color="primary" @click="show = false" />
          <q-btn type="submit" :label="t('registerTitle')" color="primary" :disable="!meta.valid" />
        </q-card-actions>
      </VeeForm>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Form as VeeForm, Field, useForm } from 'vee-validate';
import { userApi } from 'src/api';
import { useUserStore } from 'src/stores/userStore';
import type { AxiosError } from 'axios';
import { Notify } from 'quasar';
import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';

const { t } = useI18n();

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
const userStore = useUserStore();

// VeeValidate
const form = useForm<RegisterForm>({
  validateOnMount: false,
});

// Dialog 開關綁定
const show = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

// 監聽開啟時重置表單
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      form.resetForm({
        values: {
          account: '',
          email: '',
          password: '',
          confirmPassword: '',
        },
      });
    }
  },
);

// 使用 Zod 定義驗證規則
const schema = computed(() =>
  toTypedSchema(
    z
      .object({
        account: z
          .string({ required_error: t('pleaseEnterAccount') })
          .min(4, { message: t('accountTooShort') }),
        email: z.string({ required_error: t('pleaseEnterEmail') }).email(t('invalidEmail')),
        password: z
          .string({ required_error: t('pleaseEnterPassword') })
          .min(4, { message: t('passwordTooShortLogin') }),
        confirmPassword: z
          .string({ required_error: t('pleaseConfirmPassword') })
          .nonempty(t('pleaseConfirmPassword')),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: t('passwordsDoNotMatch'),
        path: ['confirmPassword'],
      }),
  ),
);

// 定義表單提交處理函數
const onSubmit = async (values: Record<string, unknown>) => {
  const registerData = values as unknown as RegisterForm;

  try {
    const res = await userApi.register({
      account: registerData.account,
      email: registerData.email,
      password: registerData.password,
    });

    const { token, user } = res.data;
    userStore.login(user.account, token, user.role as number, user.avatar);

    Notify.create({
      type: 'positive',
      message: t('registerSuccess'),
      position: 'center',
      timeout: 1500,
    });

    emit('register', registerData);
    emit('update:modelValue', false);
  } catch (err) {
    const error = err as AxiosError;
    const data = error?.response?.data as { message?: string; errors?: { msg: string }[] };
    if (data?.errors?.length) {
      data.errors.forEach((e) =>
        Notify.create({ type: 'negative', message: e.msg, position: 'top' }),
      );
    } else {
      Notify.create({
        type: 'negative',
        message: data?.message || t('registerFailed'),
        position: 'center',
      });
    }
  }
};
</script>
