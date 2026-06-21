import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useGetGoals, getGetGoalsQueryKey, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Target, CheckCircle2, Trash2, Plus, Clock } from "lucide-react";
import { format } from "date-fns";

const goalSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  targetKgCo2Reduction: z.coerce.number().min(1),
  category: z.enum(["transportation", "electricity", "food", "shopping", "other"]),
  deadline: z.string().min(1)
});

export default function GoalsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: goals, isLoading } = useGetGoals({
    query: { queryKey: getGetGoalsQueryKey() }
  });

  const createGoal = useCreateGoal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() });
        setIsDialogOpen(false);
        form.reset();
      }
    }
  });

  const updateGoal = useUpdateGoal({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() })
    }
  });

  const deleteGoal = useDeleteGoal({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() })
    }
  });

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      targetKgCo2Reduction: 50,
      category: "transportation",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  function onSubmit(values: z.infer<typeof goalSchema>) {
    createGoal.mutate({ data: values });
  }

  const activeGoals = goals?.filter(g => !g.completed) || [];
  const completedGoals = goals?.filter(g => g.completed) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold font-mono uppercase tracking-tight">Reduction Objectives</h1>
            <p className="text-muted-foreground mt-1">Track and manage active carbon reduction targets.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-mono uppercase text-xs space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Objective</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-mono uppercase tracking-wider">Initialize Target</DialogTitle>
                <DialogDescription>Define a new carbon reduction vector.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Directive Name</FormLabel>
                      <FormControl><Input className="bg-background/50" placeholder="e.g. Cycle to HQ" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Vector Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="transportation">Transportation</SelectItem>
                          <SelectItem value="electricity">Electricity</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="shopping">Shopping</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="targetKgCo2Reduction" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Target (kg CO₂)</FormLabel>
                        <FormControl><Input type="number" className="bg-background/50" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="deadline" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Deadline</FormLabel>
                        <FormControl><Input type="date" className="bg-background/50" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" disabled={createGoal.isPending} className="w-full font-mono uppercase tracking-widest mt-4">
                    {createGoal.isPending ? "Executing..." : "Commit Objective"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </header>

        {isLoading ? (
          <div className="animate-pulse text-muted-foreground font-mono">RETRIEVING OBJECTIVES...</div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeGoals.map(goal => {
                const progressPct = Math.min(100, Math.round((goal.currentProgress / goal.targetKgCo2Reduction) * 100));
                return (
                  <Card key={goal.id} className="bg-card/50 backdrop-blur border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="inline-flex items-center space-x-1 border border-primary/20 bg-primary/5 px-2 py-0.5 rounded text-[10px] text-primary font-mono uppercase tracking-wider mb-2">
                          <span>{goal.category}</span>
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => updateGoal.mutate({ id: goal.id, data: { completed: true } })}
                            className="p-1.5 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteGoal.mutate({ id: goal.id })}
                            className="p-1.5 hover:bg-destructive/20 text-destructive rounded transition-colors"
                            title="Abort Objective"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-bold font-mono text-foreground">{progressPct}%</span>
                        <div className="text-xs text-muted-foreground font-mono flex items-center space-x-1 mb-1">
                          <Target className="w-3 h-3" />
                          <span>{goal.targetKgCo2Reduction} kg</span>
                        </div>
                      </div>
                      <Progress value={progressPct} className="h-1.5 bg-muted/30 [&>div]:bg-primary mb-4" />
                      <div className="flex items-center text-xs text-muted-foreground font-mono">
                        <Clock className="w-3 h-3 mr-1.5" />
                        <span>T-minus {format(new Date(goal.deadline), "MMM d, yyyy")}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {activeGoals.length === 0 && (
                <div className="col-span-full py-12 border border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                  <Target className="w-8 h-8 mb-3 opacity-20" />
                  <p className="font-mono text-sm uppercase tracking-wider">No Active Objectives</p>
                </div>
              )}
            </div>

            {completedGoals.length > 0 && (
              <div className="pt-8">
                <h2 className="text-lg font-bold font-mono uppercase tracking-tight mb-4 flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
                  Archived Successes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {completedGoals.map(goal => (
                    <div key={goal.id} className="p-4 rounded-lg bg-card/30 border border-border/30 opacity-70 hover:opacity-100 transition-opacity">
                      <h4 className="font-medium text-sm line-clamp-1">{goal.title}</h4>
                      <p className="text-xs font-mono text-muted-foreground mt-1">{goal.targetKgCo2Reduction} kg CO₂ saved</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
