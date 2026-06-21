import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const { login } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    login(values);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
      
      <div className="w-full max-w-md relative z-10 px-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight font-mono uppercase">Zerofy</span>
          </Link>
          <h1 className="text-3xl font-bold font-mono uppercase tracking-tight">Access Terminal</h1>
          <p className="text-muted-foreground mt-2">Enter credentials to resume telemetry.</p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Secure login for active operatives.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Operative Identifier (Email)</FormLabel>
                      <FormControl>
                        <Input placeholder="operative@zerofy.net" className="font-mono bg-background/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Access Key (Password)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="font-mono bg-background/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full font-mono uppercase tracking-widest mt-6">
                  Initiate Session
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-6">
            <p className="text-sm text-muted-foreground">
              New operative?{" "}
              <Link href="/register" className="text-primary hover:underline font-mono uppercase text-xs">
                Request Clearance
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
