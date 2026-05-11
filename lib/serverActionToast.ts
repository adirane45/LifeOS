import toast from 'react-hot-toast';

/**
 * Wraps a server action with automatic toast notifications
 * @param action - The server action to wrap
 * @param successMessage - Message to show on success
 * @param errorMessage - Message to show on error (or function that generates it)
 */
export async function withServerActionToast<T extends (...args: any[]) => Promise<any>>(
  action: T,
  successMessage: string,
  errorMessage: string | ((error: unknown) => string) = 'Something went wrong'
) {
  return async (...args: Parameters<T>) => {
    try {
      const result = await action(...args);
      toast.success(successMessage);
      return result;
    } catch (error) {
      const message = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage;
      toast.error(`❌ ${message}`);
      throw error;
    }
  };
}

/**
 * Wraps a server action for form submission with optimistic updates
 * @param formData - The form data to submit
 * @param action - The server action
 * @param successMessage - Success toast message
 * @param onSuccess - Optional callback on success
 */
export async function submitServerAction(
  formData: FormData,
  action: (data: FormData) => Promise<void>,
  successMessage: string,
  onSuccess?: () => void
) {
  try {
    await action(formData);
    toast.success(`✅ ${successMessage}`);
    onSuccess?.();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process request';
    toast.error(`❌ ${message}`);
  }
}
