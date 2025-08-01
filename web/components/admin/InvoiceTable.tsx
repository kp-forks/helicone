import { InvoiceData } from "@/lib/admin/RevenueCalculator";
import { formatCurrency, getStripeLink, truncateID } from "@/lib/uiUtils";
import { ArrowDown, ArrowUp } from "lucide-react";
import React, { useMemo } from "react";

// Define Sort Configuration Type
export interface SortConfig {
  key: keyof InvoiceData | null;
  direction: "asc" | "desc";
}

// Define Props for the InvoiceTable
interface InvoiceTableProps {
  invoices: InvoiceData[];
  sortConfig: SortConfig;
  onSort: (key: keyof InvoiceData) => void;
  onViewRaw: (rawJson: any) => void;
  caption?: string; // Optional caption for context (e.g., month name)
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  sortConfig,
  onSort,
  onViewRaw,
  caption,
}) => {
  // Memoize the sorted data
  const sortedInvoices = useMemo(() => {
    const sortableItems = [...invoices]; // Shallow copy
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        let comparison = 0;
        if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          // Fallback for string or other types
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [invoices, sortConfig]);

  // Helper to render sort icon
  const renderSortIcon = (key: keyof InvoiceData) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return (
      <span className="ml-1">
        {sortConfig.direction === "asc" ? (
          <ArrowUp size={12} className="inline" />
        ) : (
          <ArrowDown size={12} className="inline" />
        )}
      </span>
    );
  };

  if (invoices.length === 0) {
    return (
      <p className="mt-2 italic text-gray-500">
        No invoices{caption ? ` for ${caption}` : ""}.
      </p>
    );
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              ID
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              onClick={() => onSort("amountAfterProcessing")} // We know this column sorts by amount
            >
              Amount
              {renderSortIcon("amountAfterProcessing")}
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              onClick={() => onSort("refundAmount")}
            >
              Refunded
              {renderSortIcon("refundAmount")}
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Customer
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              onClick={() => onSort("created")} // Sort by date
            >
              Date
              {renderSortIcon("created")}
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedInvoices.map((invoice, idx) => (
            // Use subscriptionId + index for upcoming since ID might not be unique yet
            <tr
              key={
                invoice.id.includes("upcoming") || !invoice.id.includes("in_")
                  ? `${invoice.subscriptionId}-${idx}`
                  : invoice.id
              }
            >
              <td className="whitespace-nowrap px-3 py-2 text-sm">
                {invoice.id !== "upcoming" && !invoice.id.startsWith("tmp_") ? (
                  <a
                    href={getStripeLink(invoice.id, invoice.subscriptionId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {invoice.subscriptionId && !invoice.id.includes("in_")
                      ? `sub_${truncateID(invoice.subscriptionId)}`
                      : truncateID(invoice.id)}
                  </a>
                ) : (
                  // Handle cases where ID is temporary or just 'upcoming'
                  <span className="text-muted-foreground">
                    {invoice.subscriptionId
                      ? `sub_${truncateID(invoice.subscriptionId)} (Upcoming)`
                      : "Upcoming"}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-sm">
                {formatCurrency(invoice.amountAfterProcessing)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-sm">
                {invoice.refundAmount > 0 ? (
                  <span className="font-medium text-destructive">
                    {formatCurrency(invoice.refundAmount)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-sm">
                {invoice.customerEmail}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-sm">
                {invoice.created.toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-sm">
                {invoice.status}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-sm">
                <button
                  onClick={() => onViewRaw(invoice.rawJSON)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Raw
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
