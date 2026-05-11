'use client';

import { useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import Button from './ui/Button';

type Variant = 'danger' | 'warning';

interface ConfirmDeleteFormProps {
  action: (formData: FormData) => void | Promise<void>;
  itemId: number | string;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: Variant;
  triggerLabel?: string;
  triggerClassName?: string;
  inputName?: string;
}

export default function ConfirmDeleteForm({
  action,
  itemId,
  title,
  message,
  confirmLabel = 'Delete',
  variant = 'danger',
  triggerLabel = 'Delete',
  triggerClassName = 'text-sm text-rose-600 hover:text-rose-700',
  inputName = 'id',
}: ConfirmDeleteFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    setIsOpen(false);
    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} action={action} className="inline-flex">
      <input type="hidden" name={inputName} value={String(itemId)} />
      <Button type="button" onClick={() => setIsOpen(true)} variant="ghost" className={triggerClassName}>
        {triggerLabel}
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        variant={variant}
      />
    </form>
  );
}