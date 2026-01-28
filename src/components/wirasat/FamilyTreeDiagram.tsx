
"use client";

import { cn } from "@/lib/utils";
import { User, Users, UserX, GitBranch } from "lucide-react";
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
        "relative flex h-12 w-12 items-center justify-center rounded-full border-2",
        isDeceased ? "border-amber-500/80 bg-amber-500/10" : "border-border bg-background"
    )}>
      {isDeceased ? (
          <UserX className="h-6 w-6 text-amber-600" />
      ) : (
          count && count > 1 ? <Users className="h-6 w-6 text-muted-foreground" /> : <User className="h-6 w-6 text-muted-foreground" />
      )}
    </div>
    <p className={cn("text-[11px] font-medium max-w-[80px]", isDeceased && "text-amber-600")}>{label}</p>
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

    const hasChildren = children.length > 0;

    return (
        <div className="flex flex-col items-center gap-6 rounded-lg border bg-muted/40 p-4 min-h-[300px] overflow-x-auto">
            {/* --- Parents & Deceased --- */}
            <div className="flex items-center justify-center gap-12 relative">
                {fatherAlive && <TreeNode label="Father" />}
                <div className="flex flex-col items-center">
                    {(fatherAlive || motherAlive) && <div className="h-8 w-px bg-border"></div>}
                    <div className="relative">
                        <TreeNode label="Deceased" isDeceased />
                    </div>
                    {hasChildren && <div className="h-8 w-px bg-border"></div>}
                </div>
                {motherAlive && <TreeNode label="Mother" />}
            </div>

             {/* --- Spouse --- */}
             {(widows > 0 || husbandAlive) && (
                 <div className="relative flex justify-center">
                    {widows > 0 && <TreeNode label="Widow(s)" count={widows} />}
                    {husbandAlive && <TreeNode label="Husband" />}
                     <div className="absolute top-1/2 left-full h-px w-8 bg-border -translate-y-1/2"></div>
                 </div>
            )}
            
            {/* --- Children & Grandchildren --- */}
            {hasChildren && (
                 <div className="flex w-full justify-center">
                    <div className="h-px w-full bg-border absolute top-0"></div>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-10 pt-8 relative">
                        {children.map((child, index) => (
                             <div key={child.id} className="flex flex-col items-center gap-2 relative">
                                {/* Vertical line from main branch */}
                                <div className="absolute -top-8 h-8 w-px bg-border"></div>
                                <TreeNode 
                                    label={`${child.type === 'son' ? 'Son' : 'Daughter'} ${index + 1}`} 
                                    isDeceased={!child.isAlive}
                                    className={child.type === 'son' ? 'text-blue-600' : 'text-pink-600'}
                                />
                                {!child.isAlive && (child.heirs.sons > 0 || child.heirs.daughters > 0 || child.heirs.widows > 0 || child.heirs.husbandAlive) && (
                                     <>
                                        <div className="h-6 w-px bg-border border-dashed"></div>
                                        <div className="flex justify-center gap-4 pt-2 relative">
                                            {/* Horizontal line for sub-heirs */}
                                            <div className="absolute top-0 h-px w-full bg-border border-dashed"></div>
                                            
                                            {child.heirs.widows > 0 && 
                                                <div className="flex flex-col items-center gap-2 relative">
                                                    <div className="absolute -top-6 h-6 w-px bg-border border-dashed"></div>
                                                    <TreeNode label="His Widow(s)" count={child.heirs.widows} />
                                                </div>
                                            }
                                             {child.heirs.husbandAlive && 
                                                <div className="flex flex-col items-center gap-2 relative">
                                                    <div className="absolute -top-6 h-6 w-px bg-border border-dashed"></div>
                                                    <TreeNode label="Her Husband" />
                                                </div>
                                            }
                                            {child.heirs.sons > 0 && 
                                                <div className="flex flex-col items-center gap-2 relative">
                                                    <div className="absolute -top-6 h-6 w-px bg-border border-dashed"></div>
                                                    <TreeNode label="His/Her Son(s)" count={child.heirs.sons} className="text-blue-600"/>
                                                </div>
                                            }
                                            {child.heirs.daughters > 0 && 
                                                <div className="flex flex-col items-center gap-2 relative">
                                                    <div className="absolute -top-6 h-6 w-px bg-border border-dashed"></div>
                                                    <TreeNode label="His/Her Daughter(s)" count={child.heirs.daughters} className="text-pink-600"/>
                                                </div>
                                            }
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
