import InputError from '@core/components/input-error';
import { Button } from "@core/components/ui/button";
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import { Spinner } from "@core/components/ui/spinner";
import { tt } from '@core/lib/i18n';
import { cn } from "@core/lib/utils";
import { Form } from '@inertiajs/react';
import * as React from 'react';

import { store } from '@/routes/login';
import { request } from '@/routes/password';

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
    status?: string;
    canResetPassword?: boolean;
}

export function LoginForm({
  className,
  status,
  canResetPassword = true,
  ...props
}: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Form
        {...store.form()}
        resetOnSuccess={['password']}
      >
        {({ processing, errors }) => (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">{tt('Login to your account')}</h1>
              <p className="text-balance text-sm text-muted-foreground">
                {tt('Enter your email below to login to your account')}
              </p>
            </div>

            {status && (
                <div className="rounded-md bg-green-50 p-3 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">{tt('Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder={tt('m@example.com')}
                  required
                  autoFocus
                />
                <InputError message={errors.email} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{tt('Password')}</Label>
                  {canResetPassword && (
                    <a
                      href={request().url}
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      {tt('Forgot your password?')}
                    </a>
                  )}
                </div>
                <Input id="password" type="password" name="password" required />
                <InputError message={errors.password} />
              </div>
              <Button type="submit" className="w-full" disabled={processing}>
                {processing && <Spinner />}
                {tt('Login')}
              </Button>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-white px-2 text-muted-foreground">
                  {tt('Or continue with')}
                </span>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <a href="/auth/google">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2 h-5 w-5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  {tt('Login with Google')}
                </a>
              </Button>
            </div>
          </div>
        )}
      </Form>
    </div>
  )
}
