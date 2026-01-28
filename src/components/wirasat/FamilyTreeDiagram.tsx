
"use client";

import { cn } from "@/lib/utils";
import { User, Users, UserX } from "lucide-react";
import type { ChildHeir } from "@/lib/wirasat-calculator";

interface TreeNodeProps {
  label: string;
  count?: number;
  className?: string;
  isDeceased?: boolean;
}

const TreeNode = ({ label, count, className, isDeceased }: TreeNodeProps) => (
  <div className={cn("flex flex-col items-center gap-1 text-center", className)}>
    <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full",
        isDeceased ? "bg-amber-100 dark:bg-amber-900/50" : "bg-muted"
    )}>
      {isDeceased ? (
          <UserX className="h-5 w-5 text-amber-600" />
      ) : (
          count && count > 1 ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />
      )}
    </div>
    <p className={cn("text-[10px] font-medium", isDeceased && "text-amber-600")}>{label}</p>
    {count && count > 1 && <p className="text-[9px] text-muted-foreground -mt-1">x{count}</p>}
  </div>
);


interface FamilyTreeDiagramProps {
    widows: number;
    husbandAlive: boolean;
    fatherAlive: boolean;
    motherAlive: boolean;
    children: ChildHeir[];
}

export const FamilyTreeDiagram = ({
    widows,
    husbandAlive,
    fatherAlive,
    motherAlive,
    children
}: FamilyTreeDiagramProps) => {

    const livingSons = children.filter(c => c.isAlive && c.type === 'son').length;
    const deceasedSons = children.filter(c => !c.isAlive && c.type === 'son').length;
    const livingDaughters = children.filter(c => c.isAlive && c.type === 'daughter').length;
    const deceasedDaughters = children.filter(c => !c.isAlive && c.type === 'daughter').length;
    const hasChildren = children.length > 0;

    return (
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-4">
            {/* Parents */}
            {(fatherAlive || motherAlive) && (
                <>
                    <div className="flex gap-8">
                        {fatherAlive && <TreeNode label="Father" />}
                        {motherAlive && <TreeNode label="Mother" />}
                    </div>
                    {/* Connecting Lines to Deceased */}
                    <div className="flex h-8 w-full items-center justify-center">
                        <div className="h-px w-1/4 bg-border"></div>
                        <div className="h-full w-px bg-border"></div>
                        <div className="h-px w-1/4 bg-border"></div>
                    </div>
                </>
            )}

            {/* Deceased and Spouse */}
            <div className="flex w-full items-center justify-center gap-8">
                {widows > 0 && <TreeNode label="Widow(s)" count={widows} />}
                {husbandAlive && <TreeNode label="Husband" />}
                
                <div className="relative">
                    <TreeNode label="Deceased" className="font-semibold" />
                    <div className="absolute -inset-1 rounded-full border-2 border-dashed border-primary"></div>
                </div>
            </div>
            
            {/* Connecting Lines to Children */}
            {hasChildren && (
                 <div className="h-8 w-px bg-border"></div>
            )}

            {/* Children */}
            {hasChildren && (
                <div className="flex flex-wrap justify-center gap-6">
                    {livingSons > 0 && <TreeNode label="Living Son(s)" count={livingSons} className="text-blue-600" />}
                    {livingDaughters > 0 && <TreeNode label="Living Daughter(s)" count={livingDaughters} className="text-pink-600" />}
                    {deceasedSons > 0 && <TreeNode label="Deceased Son(s)" count={deceasedSons} isDeceased />}
                    {deceasedDaughters > 0 && <TreeNode label="Deceased Daughter(s)" count={deceasedDaughters} isDeceased />}
                </div>
            )}
        </div>
    );
};
