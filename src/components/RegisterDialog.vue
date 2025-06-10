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
              label="帳號"
              outlined
              dense
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
              :error="m.touched && !!errorMessage"
              :error-message="m.touched ? errorMessage : ''"
            />
          </Field>

          <Field name="email" v-slot="{ field, errorMessage, meta: m }">
            <q-input
              label="電子郵件"
              outlined
              dense
              type="email"
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
              :error="m.touched && !!errorMessage"
              :error-message="m.touched ? errorMessage : ''"
            />
          </Field>

          <Field name="password" v-slot="{ field, errorMessage, meta: m }">
            <q-input
              label="密碼"
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
              label="確認密碼"
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

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { Form as VeeForm, Field, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useApi } from 'src/composables/axios';
import { useUserStore } from 'src/stores/userStore';
const userStore = useUserStore();

interface RegisterForm {
  account: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default defineComponent({
  components: {
    VeeForm,
    Field,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue', 'register'],
  setup(props, { emit }) {
    const { api } = useApi();

    const show = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val),
    });
    const syncShow = (val: boolean) => emit('update:modelValue', val);

    useForm<RegisterForm>();

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
        console.log(res.data);
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        userStore.login(res.data.user.account, res.data.token, res.data.user.role);

        emit('register', form);
        syncShow(false);
      } catch (err) {
        console.log(err);
      }
    };

    return {
      show,
      schema,
      onSubmit,
    };
  },
});
</script>
