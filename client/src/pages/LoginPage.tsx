import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, Hexagon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { login, isLoading: authLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);

    try {
      await login(data.username, data.password);
      console.log('Login function completed, checking auth state...');

      // Cek localStorage setelah login
      setTimeout(() => {
        const token = localStorage.getItem("auth_token");
        const userData = localStorage.getItem("user_data");
        console.log('After login - localStorage:', { token, userData });
        console.log('Redirecting to /business-trips/report after delay');
        setLocation("/business-trips/report");
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err instanceof Error ? err.message : "Login gagal. Silakan coba lagi."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-primary rounded-xl">
                <Hexagon className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="space-y-1 text-center">
                <CardTitle className="text-xl font-semibold">
                  Selamat Datang
                </CardTitle>
                <CardDescription>
                  Masuk ke akun Anda untuk melanjutkan
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">NIP</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan NIP"
                  {...register("username")}
                  className={errors.username ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    {...register("password")}
                    className={errors.password ? "border-destructive focus-visible:ring-destructive flex-1" : "flex-1"}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? (
                  <>
                    <div className="animate-spin rounded-lg h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                    Masuk...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Masuk
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <a
                  href="https://orion.marvcore.com/register"
                  className="font-medium text-foreground hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Daftar di sini
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
