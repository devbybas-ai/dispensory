"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldType = "text" | "number" | "date" | "email" | "select" | "textarea";

interface SelectOption {
  value: string;
  label: string;
}

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: SelectOption[];
  disabled?: boolean;
  className?: string;
}

const inputClasses =
  "border-input file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm";

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  options = [],
  disabled = false,
  className,
}: FormFieldProps<TFieldValues, TName>) {
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;

        const sharedProps = {
          id: fieldId,
          "aria-invalid": hasError ? (true as const) : undefined,
          "aria-describedby": hasError ? errorId : undefined,
          disabled,
        };

        return (
          <div className={cn("space-y-1.5", className)}>
            <Label htmlFor={fieldId}>{label}</Label>

            {type === "textarea" ? (
              <Textarea
                {...sharedProps}
                placeholder={placeholder}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            ) : type === "select" ? (
              <select
                {...sharedProps}
                className={cn(inputClasses, "appearance-none")}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              >
                {placeholder && (
                  <option value="" disabled>
                    {placeholder}
                  </option>
                )}
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                {...sharedProps}
                type={type}
                placeholder={placeholder}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}

            {fieldState.error?.message && (
              <p id={errorId} role="alert" className="text-destructive text-sm">
                {fieldState.error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
