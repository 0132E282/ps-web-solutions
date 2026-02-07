"use client";
import React from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { cn } from "@core/lib/utils";
import { FormData } from "@core/types/forms";

export interface FormElementProps {
  form: UseFormReturn<FormData>;
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  title?: string;
  currentRouteName?: string;
  routeTitle?: string;
  onBack: () => void;
  children: React.ReactNode;
  rest?: React.FormHTMLAttributes<HTMLFormElement>;
}

export const Form: React.FC<FormElementProps> = ({
  form,
  onSubmit,
  className,
  children,
  rest,
}) => {
  return (
    <FormProvider {...form}>
      <form {...rest} onSubmit={onSubmit} className={cn(className)} noValidate>
        {children}
      </form>
    </FormProvider>
  );
};

Form.displayName = "Form";
