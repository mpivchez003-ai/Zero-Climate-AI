import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useCalculateCarbon, useSaveCarbonProfile, getGetCarbonProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Calculator as CalcIcon, Activity } from "lucide-react";

const calculatorSchema = z.object({
  weeklyKmDriven: z.coerce.number().min(0),
  carType: z.enum(["petrol", "diesel", "ev", "none"]),
  monthlyKwh: z.coerce.number().min(0),
  energySourceMix: z.object({
    coal: z.number().min(0).max(100),
    gas: z.number().min(0).max(100),
    renewables: z.number().min(0).max(100)
  }).refine(data => data.coal + data.gas + data.renewables === 100, {
    message: "Energy mix must sum to 100%",
    path: ["renewables"]
  }),
  dietType: z.enum(["vegan", "vegetarian", "omnivore", "heavy_meat"]),
  flightsPerYear: z.coerce.number().min(0),
  flightType: z.enum(["short", "long", "mixed"]),
  monthlyShoppingSpend: z.coerce.number().min(0),
  region: z.string().min(2),
});

export default function CalculatorPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const calculateCarbon = useCalculateCarbon();
  const saveProfile = useSaveCarbonProfile();

  const form = useForm<z.infer<typeof calculatorSchema>>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      weeklyKmDriven: 100,
      carType: "petrol",
      monthlyKwh: 300,
      energySourceMix: { coal: 20, gas: 40, renewables: 40 },
      dietType: "omnivore",
      flightsPerYear: 2,
      flightType: "mixed",
      monthlyShoppingSpend: 500,
      region: "Global",
    },
  });

  async function onSubmit(values: z.infer<typeof calculatorSchema>) {
    try {
      // Assuming calculate is implicitly handled by the backend during save, 
      // or we just call save directly which computes it.
      await saveProfile.mutateAsync({ data: values });
      
      queryClient.invalidateQueries({ queryKey: getGetCarbonProfileQueryKey() });
      
      toast({
        title: "Telemetry Saved",
        description: "Your carbon profile has been calibrated.",
      });
      
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Calibration Failed",
        description: "There was an error processing your data.",
        variant: "destructive"
      });
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold font-mono uppercase tracking-tight">Calibration Matrix</h1>
          <p className="text-muted-foreground mt-1">Input primary consumption vectors for analysis.</p>
        </header>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center">
              <Activity className="w-4 h-4 mr-2 text-primary" />
              Sensor Inputs - Phase {step} / 4
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-xl font-bold font-mono">Mobility Vectors</h3>
                    <FormField
                      control={form.control}
                      name="weeklyKmDriven"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Weekly Distance (KM)</FormLabel>
                          <FormControl>
                            <Input type="number" className="font-mono bg-background/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="carType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Vehicle Classification</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="font-mono bg-background/50">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="petrol">Petrol (ICE)</SelectItem>
                              <SelectItem value="diesel">Diesel (ICE)</SelectItem>
                              <SelectItem value="ev">Electric (EV)</SelectItem>
                              <SelectItem value="none">None (Public/Bike)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-xl font-bold font-mono">Energy Vectors</h3>
                    <FormField
                      control={form.control}
                      name="monthlyKwh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Monthly Consumption (kWh)</FormLabel>
                          <FormControl>
                            <Input type="number" className="font-mono bg-background/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-background/20">
                      <p className="font-mono text-xs uppercase text-muted-foreground mb-4">Grid Composition (%)</p>
                      
                      <FormField control={form.control} name="energySourceMix.coal" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex justify-between font-mono text-xs"><span className="text-muted-foreground">Coal / Fossil</span><span className="text-primary">{field.value}%</span></FormLabel>
                          <FormControl>
                            <Slider min={0} max={100} step={1} value={[field.value]} onValueChange={vals => field.onChange(vals[0])} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="energySourceMix.gas" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex justify-between font-mono text-xs"><span className="text-muted-foreground">Natural Gas</span><span className="text-primary">{field.value}%</span></FormLabel>
                          <FormControl>
                            <Slider min={0} max={100} step={1} value={[field.value]} onValueChange={vals => field.onChange(vals[0])} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="energySourceMix.renewables" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex justify-between font-mono text-xs"><span className="text-muted-foreground">Renewables</span><span className="text-primary">{field.value}%</span></FormLabel>
                          <FormControl>
                            <Slider min={0} max={100} step={1} value={[field.value]} onValueChange={vals => field.onChange(vals[0])} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-xl font-bold font-mono">Biological & Transit Vectors</h3>
                    <FormField
                      control={form.control}
                      name="dietType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Sustenance Profile</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="font-mono bg-background/50">
                                <SelectValue placeholder="Select diet" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="heavy_meat">Heavy Meat</SelectItem>
                              <SelectItem value="omnivore">Average Omnivore</SelectItem>
                              <SelectItem value="vegetarian">Vegetarian</SelectItem>
                              <SelectItem value="vegan">Vegan / Plant-based</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="flightsPerYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Annual Flights</FormLabel>
                            <FormControl>
                              <Input type="number" className="font-mono bg-background/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="flightType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Range Profile</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="font-mono bg-background/50">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="short">Short Haul</SelectItem>
                                <SelectItem value="long">Long Haul</SelectItem>
                                <SelectItem value="mixed">Mixed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-xl font-bold font-mono">Economic Vectors</h3>
                    <FormField
                      control={form.control}
                      name="monthlyShoppingSpend"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Monthly Goods Expenditure (£)</FormLabel>
                          <FormControl>
                            <Input type="number" className="font-mono bg-background/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Geographic Zone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="font-mono bg-background/50">
                                <SelectValue placeholder="Select region" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UK">United Kingdom</SelectItem>
                              <SelectItem value="EU">European Union</SelectItem>
                              <SelectItem value="US">North America</SelectItem>
                              <SelectItem value="Global">Global Average</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="font-mono uppercase"
                  >
                    Reverse
                  </Button>
                  
                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={() => setStep(s => Math.min(4, s + 1))}
                      className="font-mono uppercase"
                    >
                      Proceed
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={saveProfile.isPending}
                      className="font-mono uppercase flex items-center space-x-2"
                    >
                      <span>{saveProfile.isPending ? "Computing..." : "Finalize Telemetry"}</span>
                      {!saveProfile.isPending && <CalcIcon className="w-4 h-4 ml-2" />}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
