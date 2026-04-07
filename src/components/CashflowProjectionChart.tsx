import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

interface CashflowProjectionProps {
  totalInvestment: number;
  annualRentalIncome: number;
  annualDepreciation: number;
  residualValue: number;
  depreciationYears: number;
  loanAmount: number;
  loanInterestRate: number;
  loanTermYears: number;
}

export function CashflowProjectionChart({
  totalInvestment,
  annualRentalIncome,
  annualDepreciation,
  residualValue,
  depreciationYears,
  loanAmount,
  loanInterestRate,
  loanTermYears,
}: CashflowProjectionProps) {
  const years = Math.max(depreciationYears, loanTermYears, 1);
  const annualLoanPayment = loanAmount > 0 && loanTermYears > 0
    ? loanAmount * ((loanInterestRate / 100) / (1 - Math.pow(1 + loanInterestRate / 100, -loanTermYears)))
    : 0;

  const data = [];
  let cumulativeCashflow = -totalInvestment;

  for (let year = 1; year <= years; year++) {
    const income = annualRentalIncome;
    const loanCost = year <= loanTermYears ? annualLoanPayment : 0;
    const netCashflow = income - loanCost + (year === years ? residualValue : 0);
    cumulativeCashflow += netCashflow;

    data.push({
      year: `Jaar ${year}`,
      Verhuurinkomsten: Math.round(income),
      Leningaflossing: -Math.round(loanCost),
      ...(year === years ? { Restwaarde: Math.round(residualValue) } : {}),
      "Cumulatief": Math.round(cumulativeCashflow),
    });
  }

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="year" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) => `€${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
          />
          <Legend />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Bar dataKey="Verhuurinkomsten" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Leningaflossing" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Restwaarde" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
