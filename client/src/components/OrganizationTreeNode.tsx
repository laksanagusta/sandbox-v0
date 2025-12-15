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
      directorate: "bg-blue-100 text-blue-800",
      division: "bg-green-100 text-green-800",
      department: "bg-purple-100 text-purple-800",
      unit: "bg-orange-100 text-orange-800",
    };

    const colorClass = colors[type] || "bg-gray-100 text-gray-800";
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
              className={`absolute border-l border-gray-300 w-px ${isLast ? 'h-[50%] top-0' : 'h-full top-0'}`} 
              style={{ left: '-11px' }} 
            />
            {/* Horizontal Line */}
            <div 
              className="absolute border-t border-gray-300 h-px w-[12px]" 
              style={{ left: '-11px', top: '50%', transform: 'translateY(-50%)' }} 
            />
          </>
        )}

        <div className="flex items-center space-x-2">
          {/* Expander */}
          <div className="relative z-10 bg-background rounded-full">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleNode(organization.id);
                }}
                className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full"
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
            <div className="mr-2 text-gray-500">
             {level === 0 ? (
                <LayoutDashboard className="w-5 h-5 text-blue-600" />
             ) : hasChildren ? (
                isExpanded ? <FolderOpen className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-blue-500" />
             ) : (
                <FileText className="w-4 h-4 text-gray-400" />
             )}
            </div>

            <span className={`text-sm ${level === 0 ? "font-semibold text-gray-900" : "text-gray-700"}`}>
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