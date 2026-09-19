import { CalendarRange, Percent, Info } from "lucide-react";

// The regulatory disclosure that sits under the EMI calculator: the repayment window, the
// ceiling APR, and one worked example showing where every rupee of a loan goes.
//
// Rendered on the server — nothing here changes after build, so it costs the page no
// JavaScript.

const HEADLINE_FACTS = [
  {
    icon: CalendarRange,
    label: "Loan repayment term",
    value: "61 – 180 Days",
  },
  {
    icon: Percent,
    label: "Maximum Annual Percentage Rate (APR)",
    value: "375%",
  },
] as const;

// One row, nine columns. Kept as data rather than markup because the same list drives
// both presentations of the table below — see the note on the <td> classes.
//
// `emphasis` is spent on only two figures: what leaves the borrower's account each month
// and what it adds up to. Colouring more than that turned the row into scattered red
// without saying which number mattered most.
const EXAMPLE_COLUMNS = [
  { label: "Loan Amount", value: "₹1,000" },
  { label: "APR", value: "375%" },
  { label: "Tenure", value: "6 Months" },
  { label: "Processing Fee", value: "₹70" },
  { label: "GST on Processing Fee", value: "₹13" },
  { label: "Amount Disbursed", value: "₹917" },
  { label: "EMI", value: "₹479", emphasis: true },
  { label: "Total Repayment Amount", value: "₹2,875", emphasis: true },
  { label: "Total Interest", value: "₹1,875" },
] as const;

export default function DisclaimerSection() {
  return (
    <section
      id="disclaimers"
      aria-labelledby="disclaimers-heading"
      className="w-full max-w-7xl mx-auto py-4 p-6 md:p-12 lg:p-20"
    >
      <div className="flex flex-col justify-center items-center-safe space-y-6 w-full">
        <div className="flex flex-col justify-center items-center-safe space-y-2 text-center w-full mb-10 md:mb-14">
          <span className="text-primary font-semibold leading-tight uppercase">
            important information
          </span>
          <h2 id="disclaimers-heading" className="lg:text-4xl text-3xl font-bold">
            Loan <span className="text-primary">Disclaimers</span>
          </h2>
          <p className="text-gray-600 text-base max-w-2xl pt-2">
            The figures below are a representative example, shown so you can see exactly
            what a loan costs before you apply.
          </p>
        </div>

        {/* The two numbers that bound every loan. */}
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {HEADLINE_FACTS.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-[#FFECEB] bg-[#FFECEB]/50 p-5 md:p-6"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 leading-tight">{label}</span>
                <span className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Representative example.

            ONE <table> serves both layouts rather than a desktop table plus a duplicate
            mobile list. Below `xl` the header row is dropped and each cell prints its own
            label from `data-label`, stacking into label/value rows; from `xl` up it is an
            ordinary table. One DOM means screen readers get a real table at every width
            and nothing is announced twice.

            The switch is at `xl`, not `md`, because nine columns that do not wrap need
            about 1050px and the section only offers that past 1280px. Switching at `md`
            put a clipped table on every tablet, with "Total Repayment Amount" sliced in
            half and no sign that anything had been cut. Stacked rows carry the same nine
            figures in full at those widths.

            Nothing wraps once it is a table: letting the longer headings break over two
            lines made a tall ragged header band with one thin row floating under it. Each
            cell is `whitespace-nowrap`, so a column is exactly as wide as its widest
            content, and the wrapper still scrolls on any width that cannot hold the lot. */}
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-5 py-4 md:px-6">
            <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <h3 className="font-semibold text-foreground">Representative Example</h3>
          </div>

          <div className="w-full xl:overflow-x-auto">
            <table className="w-full border-collapse text-left xl:min-w-max">
              <caption className="sr-only">
                Representative example for a ₹1,000 loan over 6 months at 375% APR
              </caption>
              <thead className="hidden xl:table-header-group">
                <tr>
                  {EXAMPLE_COLUMNS.map(({ label }, index) => (
                    <th
                      key={label}
                      scope="col"
                      className={`whitespace-nowrap border-b border-gray-200 bg-white px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500
                        ${index === 0 ? "text-left" : "text-right"}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="block xl:table-row-group">
                <tr className="block xl:table-row">
                  {EXAMPLE_COLUMNS.map(({ label, value, ...rest }, index) => {
                    const emphasis = "emphasis" in rest && rest.emphasis;
                    return (
                      <td
                        key={label}
                        data-label={label}
                        // `tabular-nums` keeps the rupee figures on a common grid; without
                        // it the digits sit at their own natural widths and the column of
                        // amounts reads crooked.
                        //
                        // The row divider is dropped at `xl`: stacked, each cell IS a row
                        // and needs its own rule, but in the table the cell borders drew a
                        // line that stopped short of the card edge under the last column.
                        className={`flex items-baseline justify-between gap-6 whitespace-nowrap border-b border-gray-100 px-5 py-3 text-right text-base tabular-nums
                          before:content-[attr(data-label)] before:whitespace-normal before:text-left before:text-sm before:font-medium before:text-gray-500
                          last:border-b-0 xl:table-cell xl:border-b-0 xl:px-4 xl:py-4 xl:text-[15px] xl:before:hidden
                          ${index === 0 ? "xl:text-left" : "xl:text-right"}
                          ${emphasis ? "font-bold text-primary" : "font-semibold text-foreground"}`}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
