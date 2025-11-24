import React from "react";
import { Building, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Organization {
  id: string;
  name: string;
  address: string | null;
  type: string;
  organizations: Organization[] | null;
  created_at: string;
  created_by: string;
}

interface TreeNodeProps {
  organization: Organization;
  level: number;
  expandedNodes: Set<string>;
  onToggleNode: (nodeId: string) => void;
}

export function TreeNode({ organization, level, expandedNodes, onToggleNode }: TreeNodeProps) {
  const hasChildren = organization.organizations && organization.organizations.length > 0;
  const isExpanded = expandedNodes.has(organization.id);
  const indentClass = `ml-${level * 4}`;

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      directorate: "bg-blue-100 text-blue-800",
      division: "bg-green-100 text-green-800",
      department: "bg-purple-100 text-purple-800",
      unit: "bg-orange-100 text-orange-800",
    };

    const colorClass = colors[type] || "bg-gray-100 text-gray-800";
    return (
      <Badge className={colorClass}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center space-x-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer ${indentClass}`}
        onClick={() => hasChildren && onToggleNode(organization.id)}
      >
        {hasChildren && (
          <div className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </div>
        )}
        {!hasChildren && (
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        )}
        <Building className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 truncate">{organization.name}</span>
            {getTypeBadge(organization.type)}
          </div>
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div className="ml-6 border-l-2 border-gray-200">
          {organization.organizations?.map((child) => (
            <TreeNode
              key={child.id}
              organization={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggleNode={onToggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}