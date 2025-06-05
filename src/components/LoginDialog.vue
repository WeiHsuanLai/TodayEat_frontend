<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 350px">
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
              label="帳號"
              outlined
              dense
              autofocus
              :error="fieldMeta.touched && !!errorMessage"
              :error-message="fieldMeta.touched ? errorMessage : ''"
            />
          </Field>

          <Field name="password" v-slot="{ field, errorMessage, meta: fieldMeta }">
            <q-input
              type="password"
              :model-value="field.value"
              @update:model-value="field.onChange"
              @blur="field.onBlur"
              :name="field.name"
              label="密碼"
              outlined
              dense
              :error="fieldMeta.touched && !!errorMessage"
              :error-message="fieldMeta.touched ? errorMessage : ''"
            />
          </Field>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" @click="show = false" />
          <q-btn type="submit" label="登入" color="primary" :disable="!meta.valid" />
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
import { Notify } from 'quasar';

interface LoginForm {
  account: string;
  password: string;
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
  emits: ['update:modelValue', 'login'],
  setup(props, { emit }) {
    const { api } = useApi();
    useForm<LoginForm>();

    const show = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val),
    });

    const schema = yup.object({
      account: yup.string().required('請輸入帳號'),
      password: yup.string().min(4, '密碼至少 4 碼').required('請輸入密碼'),
    });

    const onSubmit = async (values: Record<string, unknown>) => {
      const login = values as unknown as LoginForm;

      try {
        const res = await api.post('/user/login', {
          account: login.account,
          password: login.password,
        });

        // 假設成功會有 token 或使用者資訊
        console.log('✅ 登入成功', res.data);

        emit('login', res.data); // 可以視需求 emit 給父元件
        show.value = false;
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as { response?: { data?: { message?: string } } }).response;
          console.log(response?.data?.message || '登入失敗，請檢查帳號密碼');
        } else {
          Notify.create({
            type: 'negative',
            message: '發生未知錯誤',
          });
          console.log('發生未知錯誤');
        }
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
