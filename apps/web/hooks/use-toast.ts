"use client";

import { useEffect, useState } from "react";

export type ToastVariant = "default" | "success" | "warning" | "destructive";

export type ToastData = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

type Listener = (toasts: ToastData[]) => void;

let toasts: ToastData[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function toast(data: Omit<ToastData, "id">) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, ...data }];
  emit();
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToast() {
  const [state, setState] = useState<ToastData[]>(toasts);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return { toasts: state, toast, dismiss: dismissToast };
}
