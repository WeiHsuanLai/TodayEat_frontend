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
                label="請填寫您的Email"
                outlined
                dense
                :error="fieldMeta.touched && !!errorMessage"
                :error-message="fieldMeta.touched ? errorMessage : ''"
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

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
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

    watch(
      () => props.modelValue,
      (val) => {
        if (val) {
          isResetMode.value = false;
        }
      },
    );

    const isResetMode = ref(false);
    const toggleResetMode = () => {
      isResetMode.value = !isResetMode.value;
    };

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
        const res = await api.post('/user/login', {
          account: login.account,
          password: login.password,
        });

        // 假設成功會有 token 或使用者資訊
        console.log('✅ 登入成功');
        console.log('res', res.data);

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
        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as { response?: { data?: { message?: string } } }).response;
          console.log(response?.data?.message || '登入失敗，請檢查帳號密碼');
          Notify.create({
            type: 'negative',
            message: `${response?.data?.message}`,
            position: 'center',
            timeout: 1000,
          });
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
      toggleResetMode,
      isResetMode,
    };
  },
});
</script>
