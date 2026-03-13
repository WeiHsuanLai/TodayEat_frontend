<template>
  <q-page class="q-pa-md row justify-center">
    <div class="col-12 col-sm-8 col-md-6 col-lg-4">
      <q-card flat bordered class="q-pa-md">
        <q-card-section>
          <div class="text-h6">{{ t('changePassword') }}</div>
        </q-card-section>

        <VeeForm :validation-schema="schema" @submit="onSubmit" v-slot="{ meta }">
          <q-card-section class="q-gutter-y-md">
            <Field name="currentPassword" v-slot="{ field, errorMessage, meta: m }">
              <q-input
                v-bind="field"
                type="password"
                :label="t('oldPassword')"
                outlined
                dense
                :error="m.touched && !!errorMessage"
                :error-message="errorMessage"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
              />
            </Field>

            <Field name="newPassword" v-slot="{ field, errorMessage, meta: m }">
              <q-input
                v-bind="field"
                type="password"
                :label="t('newPassword')"
                outlined
                dense
                :error="m.touched && !!errorMessage"
                :error-message="errorMessage"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
              />
            </Field>

            <Field name="confirmPassword" v-slot="{ field, errorMessage, meta: m }">
              <q-input
                v-bind="field"
                type="password"
                :label="t('confirmNewPassword')"
                outlined
                dense
                :error="m.touched && !!errorMessage"
                :error-message="errorMessage"
                :model-value="field.value"
                @update:model-value="field.onChange"
                @blur="field.onBlur"
              />
            </Field>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              :label="t('changePassword')"
              color="primary"
              type="submit"
              :disable="!meta.valid || loading"
              :loading="loading"
            />
          </q-card-actions>
        </VeeForm>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Form as VeeForm, Field } from 'vee-validate';
import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import { userApi } from 'src/api';
import { Notify } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { AxiosError } from 'axios';

const { t } = useI18n();
const loading = ref(false);

const schema = computed(() =>
  toTypedSchema(
    z
      .object({
        currentPassword: z.string().min(1, t('pleaseEnterOldPassword')),
        newPassword: z.string().min(4, t('passwordTooShort')),
        confirmPassword: z.string().min(1, t('pleaseConfirmNewPassword')),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: t('passwordsDoNotMatch'),
        path: ['confirmPassword'],
      }),
  ),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onSubmit = async (values: any, { resetForm }: any) => {
  loading.value = true;
  try {
    await userApi.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });

    Notify.create({
      type: 'positive',
      message: t('passwordChanged'),
      position: 'center',
    });

    resetForm();
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || t('passwordChangeFailed'),
      position: 'center',
    });
  } finally {
    loading.value = false;
  }
};
</script>
