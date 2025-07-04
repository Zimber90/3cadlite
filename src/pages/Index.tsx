import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Clock, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { startOfMonth, endOfMonth, format, subMonths, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CustomChartTooltip from "@/components/CustomChartTooltip"; // Importa il nuovo componente

const Index = () => {
  const { loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalActivations: 0,
    pendingActivations: 0,
    currentMonthActivations: 0,
  });
  const [monthlyData, setMonthlyData] = useState<Array<{ name: string; Attivazioni: number }>>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStatsAndChartData = async () => {
      setLoadingStats(true);
      try {
        // Total Activations
        const { count: totalCount, error: totalError } = await supabase
          .from("activations")
          .select("*", { count: "exact", head: true });

        if (totalError) throw totalError;

        // Pending Activations (activation_date is null)
        const { count: pendingCount, error: pendingError } = await supabase
          .from("activations")
          .select("*", { count: "exact", head: true })
          .is("activation_date", null);

        if (pendingError) throw pendingError;

        // Current Month Activations (based on request_date)
        const startOfCurrentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
        const endOfCurrentMonth = format(endOfMonth(new Date()), "yyyy-MM-dd");

        const { count: monthCount, error: monthError } = await supabase
          .from("activations")
          .select("*", { count: "exact", head: true })
          .gte("request_date", startOfCurrentMonth)
          .lte("request_date", endOfCurrentMonth);

        if (monthError) throw monthError;

        setStats({
          totalActivations: totalCount || 0,
          pendingActivations: pendingCount || 0,
          currentMonthActivations: monthCount || 0,
        });

        // Fetch data for the chart (last 12 months)
        const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11)); // Start of 12 months ago
        const today = endOfMonth(new Date()); // End of current month

        const { data: chartRawData, error: chartError } = await supabase
          .from("activations")
          .select("request_date")
          .gte("request_date", format(twelveMonthsAgo, "yyyy-MM-dd"))
          .lte("request_date", format(today, "yyyy-MM-dd"));

        if (chartError) throw chartError;

        const monthlyCounts: { [key: string]: number } = {};
        chartRawData.forEach(item => {
          const monthKey = format(parseISO(item.request_date), "MMM yy"); // e.g., "Jan 24"
          monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
        });

        // Create an array for the last 12 months, even if no data
        const chartData = [];
        for (let i = 11; i >= 0; i--) {
          const month = subMonths(new Date(), i);
          const monthName = format(month, "MMM yy");
          chartData.push({
            name: monthName,
            Attivazioni: monthlyCounts[monthName] || 0,
          });
        }
        setMonthlyData(chartData);

      } catch (error: any) {
        showError(`Errore nel caricamento delle statistiche: ${error.message}`);
        console.error("Error fetching stats or chart data:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (!authLoading) {
      fetchStatsAndChartData();
    }
  }, [authLoading]);

  if (authLoading || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
        <Loader2 className="h-8 w-8 animate-spin mr-2" /> Caricamento...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start p-4 h-full">
      <div className="text-center mb-8 w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Benvenuto in Gestione Attivazioni 3cadlite</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Ecco un riepilogo delle tue attivazioni:
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Attivazioni</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivations}</div>
            <p className="text-xs text-muted-foreground">Tutte le attivazioni registrate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attivazioni in Sospeso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingActivations}</div>
            <p className="text-xs text-muted-foreground">Attivazioni in attesa di completamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attivazioni Mese Corrente</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentMonthActivations}</div>
            <p className="text-xs text-muted-foreground">Richieste questo mese</p>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full max-w-4xl mb-8">
        <CardHeader>
          <CardTitle>Attivazioni Mensili (Ultimi 12 Mesi)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid stroke="hsl(var(--muted))" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => value.replace(' ', '\n')} // Formatta per andare a capo
                />
                <YAxis
                  allowDecimals={false}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }} />
                <Bar dataKey="Attivazioni" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <MadeWithDyad />
      <p className="text-xs text-muted-foreground mt-4">Versione App: 1.0.2</p> {/* Nuovo indicatore di versione */}
    </div>
  );
};

export default Index;