import React from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  PlusCircle, 
  MinusCircle, 
  Folder, 
  FolderOpen, 
  FileText,
  LayoutDashboard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  isLast?: boolean;
}

export function TreeNode({ organization, level, expandedNodes, onToggleNode, isLast = false }: TreeNodeProps) {
  const hasChildren = organization.organizations && organization.organizations.length > 0;
  const isExpanded = expandedNodes.has(organization.id);

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      directorate: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
      division: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
      department: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
      unit: "bg-orange-100 text-orange-800",
    };

    const colorClass = colors[type] || "bg-muted text-muted-foreground";
    return (
      <Badge variant="outline" className={`${colorClass} ml-2 border-0 font-normal`}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="relative">
      <div 
        className="flex items-center py-1 group"
      >
        {/* Guide Lines for Level > 0 */}
        {level > 0 && (
          <>
            {/* Vertical Line */}
            <div 
              className={`absolute border-l border-border w-px ${isLast ? 'h-[50%] top-0' : 'h-full top-0'}`} 
              style={{ left: '-11px' }} 
            />
            {/* Horizontal Line */}
            <div 
              className="absolute border-t border-border h-px w-[12px]" 
              style={{ left: '-11px', top: '50%', transform: 'translateY(-50%)' }} 
            />
          </>
        )}

        <div className="flex items-center space-x-2">
          {/* Expander */}
          <div className="relative z-10 bg-background rounded-lg">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleNode(organization.id);
                }}
                className="flex items-center justify-center text-muted-foreground hover:text-muted-foreground transition-colors bg-card rounded-lg"
              >
                {isExpanded ? (
                  <MinusCircle className="w-4 h-4" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
              </button>
            ) : (
              // Spacer for alignment if needed, or visual dot
              level === 0 ? null : <div className="w-4 h-4" />
            )}
            {/* Root node sometimes has a different expander setup, but usually consistent */}
          </div>

          {/* Node Content */}
          <div 
            className="flex items-center cursor-pointer select-none"
            onClick={() => hasChildren && onToggleNode(organization.id)}
          >
            {/* Icon */}
            <div className="mr-2 text-muted-foreground">
             {level === 0 ? (
                <LayoutDashboard className="w-5 h-5 text-primary" />
             ) : hasChildren ? (
                isExpanded ? <FolderOpen className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-blue-500" />
             ) : (
                <FileText className="w-4 h-4 text-muted-foreground" />
             )}
            </div>

            <span className={`text-sm ${level === 0 ? "font-semibold text-foreground" : "text-foreground"}`}>
              {organization.name}
            </span>
          </div>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="ml-[19px] pl-[11px] relative"> 
           {/* 
              ml-[19px] aligns the container with the center of the expander?
              Expander is w-4 (16px). Center is 8px.
              If we want the border line of children to start at center of parent.
              Actually, the border line is drawn by the children themselves at -11px.
              So we need the container to start at a position where -11px aligns with parent center.
              Parent center (expander center) is roughly 8px from left (plus any padding).
           */}
          {organization.organizations?.map((child, index) => (
            <TreeNode
              key={child.id}
              organization={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggleNode={onToggleNode}
              isLast={index === (organization.organizations?.length || 0) - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}