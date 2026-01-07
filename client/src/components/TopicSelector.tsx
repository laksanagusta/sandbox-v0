import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { workPaperTopicApi, WorkPaperTopic } from "@/services/work-paper-topic-api";

interface TopicSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TopicSelector({
  value,
  onValueChange,
  placeholder = "Pilih topic",
  disabled = false,
  className = "",
}: TopicSelectorProps) {
  const [topics, setTopics] = useState<WorkPaperTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await workPaperTopicApi.getActiveTopics();
        setTopics(response.data || []);
      } catch (err) {
        console.error("Error fetching topics:", err);
        setError(err instanceof Error ? err.message : "Gagal memuat topics");
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 h-10 px-3 py-2 border rounded-md bg-muted/50 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading topics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center h-10 px-3 py-2 border border-red-200 rounded-md bg-red-50 ${className}`}>
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  const selectedTopic = topics.find((t) => t.id === value);

  return (
    <Select
      value={value || ""}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedTopic?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>

        {topics.map((topic) => (
          <SelectItem key={topic.id} value={topic.id}>
            <div className="flex flex-col">
              <span>{topic.name}</span>
              {topic.description && (
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {topic.description}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default TopicSelector;
