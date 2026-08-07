import { api } from "./api";
export interface ReportFilters {
  dataset: "campaigns" | "events" | "conversions";
  campaignId?: string;
  brokerId?: string;
  managerId?: string;
  templateId?: string;
  from?: string;
  to?: string;
  source?: string;
  status?: string;
  product?: string;
  development?: string;
}
export const reportsService = {
  async downloadCsv(filters: ReportFilters) {
    const query = new URLSearchParams(
      Object.entries(filters).filter((entry): entry is [string, string] =>
        Boolean(entry[1]),
      ),
    ).toString();
    const blob = await api.blob(`/reports/export.csv?${query}`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `impulse-${filters.dataset}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
