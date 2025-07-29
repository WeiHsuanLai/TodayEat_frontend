export { };

declare global {
  interface Window {
    google?: typeof google;
    _googleInitialized?: boolean;
  }

  namespace google {
    namespace accounts.id {
      type MomentType = 'display' | 'skipped' | 'dismissed';

      interface CredentialResponse {
        clientId: string;
        credential: string;
        select_by: string;
      }

      interface PromptMomentNotification {
        momentType?: MomentType;
        isDisplayMoment(): boolean;
        isNotDisplayed(): boolean;
        getNotDisplayedReason(): string; // 'browser_not_supported', etc.
        isSkippedMoment(): boolean;
        getSkippedReason(): string; // 'user_not_signed_in', etc.
        isDismissedMoment(): boolean;
        getDismissedReason(): string; // 'credential_returned', etc.
      }

      function initialize(config: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        prompt_parent_id?: string;
        context?: "signin" | "signup" | "use";
        use_fedcm_for_prompt?: boolean;
      }): void;

      function prompt(callback?: (notification: PromptMomentNotification) => void): void;

      function disableAutoSelect(): void;

      function revoke(email: string, done?: () => void): void;
    }
  }
}
