import { AlertCircle, Columns3 } from "lucide-react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";

export function PipelineEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={<Columns3 size={22} />}
    />
  );
}

export function PipelineErrorState({ message }: { message: string }) {
  return (
    <Card
      role="alert"
      padding="sm"
      className="flex items-start gap-3 border-red-200 bg-red-50 text-sm text-red-700 hover:border-red-200"
    >
      <AlertCircle className="mt-0.5 shrink-0" size={18} />
      <div>
        <strong className="block text-red-900">
          Não foi possível concluir a operação
        </strong>
        <span>{message}</span>
      </div>
    </Card>
  );
}
