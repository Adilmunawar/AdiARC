
"use client";

import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import { cn } from "@/lib/utils";
import { WirasatRow } from "@/lib/wirasat-calculator";

const NODE_WIDTH = 120;
const NODE_HEIGHT = 60;
const LEVEL_GAP_Y = 120;
const SIBLING_GAP_X = 40;

const Node = ({ title, area, share, isDeceased = false }: { title: string; area: string; share?: string; isDeceased?: boolean }) => {
  const getNodeShape = (relation: string) => {
    if (relation.toLowerCase().includes("daughter")) return "oval";
    if (["mother", "widow", "sister"].some(prefix => relation.toLowerCase().includes(prefix))) return "oval";
    return "square";
  };
  const shape = getNodeShape(title);
  
  const content = (
       <div className="flex flex-col items-center justify-center text-center p-1 w-full h-full">
          <p className="font-semibold text-xs whitespace-nowrap">{title}</p>
          <p className="text-[10px] text-muted-foreground whitespace-nowrap">{area}</p>
          {share && <p className="text-[9px] text-primary font-medium pt-0.5">{share}</p>}
      </div>
  );

  const baseClasses = "relative flex items-center justify-center border-2 shadow-sm bg-background";
  const shapeClasses = { oval: "rounded-full", square: "rounded-lg" };

  return <div className={cn(baseClasses, shapeClasses[shape], isDeceased ? "border-amber-500/80 bg-amber-500/10" : "border-border")} style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}>{content}</div>;
};

const SvgPath = ({ d, className }: { d: string, className?: string }) => (
  <path d={d} className={cn("stroke-border", className)} strokeWidth="1.5" fill="none" />
);


export const DistributionDiagram = ({ rows, totalAreaFormatted }: { rows: WirasatRow[]; totalAreaFormatted: string; allHeirs: any; }) => {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newPositions: Record<string, { x: number, y: number }> = {};
    if (!containerRef.current) return;

    const canvasWidth = containerRef.current.offsetWidth || 800;
    const center = canvasWidth / 2;
    let y = 0;

    // Parents
    const parentNodes = rows.filter(r => r.relation === 'Father' || r.relation === 'Mother');
    if (parentNodes.length === 1) {
        newPositions[parentNodes[0].relation] = { x: center - NODE_WIDTH / 2, y };
    } else if (parentNodes.length > 1) {
        newPositions['Father'] = { x: center - NODE_WIDTH - SIBLING_GAP_X / 2, y };
        newPositions['Mother'] = { x: center + SIBLING_GAP_X / 2, y };
    }

    y += LEVEL_GAP_Y;

    // Deceased & Spouse
    newPositions['Deceased'] = { x: center - NODE_WIDTH / 2, y };
    const spouseNodes = rows.filter(r => r.relation.startsWith('Widow') || r.relation.startsWith('Husband'));
    if (spouseNodes.length > 0) {
        let spouseX = center + NODE_WIDTH / 2 + 60;
        spouseNodes.forEach((node, index) => {
            newPositions[node.relation] = { x: spouseX, y: y + (index * (NODE_HEIGHT + 20))};
        });
    }

    // Children
    y += LEVEL_GAP_Y;
    const childrenRows = rows.filter(r => r.relation.startsWith('Son') || r.relation.startsWith('Daughter') || r.relation.startsWith('Deceased son') || r.relation.startsWith('Deceased daughter'));
    if (childrenRows.length > 0) {
        const childrenTotalWidth = childrenRows.length * (NODE_WIDTH + SIBLING_GAP_X) - SIBLING_GAP_X;
        let childX = center - childrenTotalWidth / 2;

        childrenRows.forEach(childRow => {
            newPositions[childRow.relation] = { x: childX, y: y };
            
            if (childRow.subRows && childRow.subRows.length > 0) {
                const grandchildY = y + LEVEL_GAP_Y;
                const grandchildrenTotalWidth = childRow.subRows.length * (NODE_WIDTH + SIBLING_GAP_X) - SIBLING_GAP_X;
                let grandchildX = childX + (NODE_WIDTH / 2) - (grandchildrenTotalWidth / 2);

                childRow.subRows.forEach(subRow => {
                    const subKey = `${childRow.relation}-${subRow.relation}`;
                    newPositions[subKey] = { x: grandchildX, y: grandchildY };
                    grandchildX += NODE_WIDTH + SIBLING_GAP_X;
                });
            }
            childX += NODE_WIDTH + SIBLING_GAP_X;
        });
    }
    setPositions(newPositions);
  }, [rows]);


  const handleDrag = (e: any, data: any, key: string) => {
    setPositions(prev => ({ ...prev, [key]: { x: data.x, y: data.y } }));
  };

  const deceasedPos = positions['Deceased'];
  const childrenRows = rows.filter(r => r.relation.startsWith('Son') || r.relation.startsWith('Daughter') || r.relation.startsWith('Deceased son') || r.relation.startsWith('Deceased daughter'));
  
  return (
    <div ref={containerRef} className="relative w-full min-h-[600px] p-4 bg-muted/30 rounded-lg border overflow-auto">
      {deceasedPos && (
        <>
            <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }}>
              {(() => {
                const parentNodes = rows.filter(r => r.relation === 'Father' || r.relation === 'Mother').map(r => positions[r.relation]).filter(Boolean);
                if (parentNodes.length > 0) {
                    const parentMidX = parentNodes.reduce((sum, p) => sum + p.x + NODE_WIDTH / 2, 0) / parentNodes.length;
                    const parentY = parentNodes[0].y + NODE_HEIGHT;
                    if (parentNodes.length > 1) {
                         return (
                            <React.Fragment key="parent-lines">
                                <SvgPath d={`M ${parentNodes[0].x + NODE_WIDTH / 2},${parentNodes[0].y + NODE_HEIGHT/2} H ${parentNodes[1].x + NODE_WIDTH / 2}`} />
                                <SvgPath d={`M ${parentMidX},${parentY} V ${deceasedPos.y}`} />
                            </React.Fragment>
                         );
                    }
                    return <SvgPath d={`M ${parentMidX},${parentY} V ${deceasedPos.y}`} />;
                }
                return null;
              })()}

              {rows.filter(r => r.relation.startsWith('Widow') || r.relation.startsWith('Husband')).map(r => positions[r.relation]).filter(Boolean).map((sp, i) => (
                  <SvgPath key={`sp-${i}`} d={`M ${deceasedPos.x},${deceasedPos.y + NODE_HEIGHT / 2} H ${sp.x + NODE_WIDTH}`} />
              ))}

              {childrenRows.map((childRow) => {
                if (childRow.subRows && childRow.subRows.length > 0) {
                  const parentNodePos = positions[childRow.relation];
                  const subRowsPos = childRow.subRows.map(sr => positions[`${childRow.relation}-${sr.relation}`]).filter(Boolean);
                  if (parentNodePos && subRowsPos.length > 0) {
                     const subBusY = parentNodePos.y + LEVEL_GAP_Y * 0.75;
                     const minSubX = Math.min(...subRowsPos.map(p => p.x + NODE_WIDTH/2));
                     const maxSubX = Math.max(...subRowsPos.map(p => p.x + NODE_WIDTH/2));

                     return (
                        <React.Fragment key={`sub-frag-${childRow.relation}`}>
                            <SvgPath d={`M ${parentNodePos.x + NODE_WIDTH / 2},${parentNodePos.y + NODE_HEIGHT} V ${subBusY}`} className="stroke-dashed" />
                            <SvgPath d={`M ${minSubX},${subBusY} H ${maxSubX}`} className="stroke-dashed" />
                            {subRowsPos.map((srPos, subIndex) => (
                               <SvgPath key={`sub-line-${subIndex}`} d={`M ${srPos.x + NODE_WIDTH / 2},${subBusY} V ${srPos.y}`} className="stroke-dashed" />
                            ))}
                        </React.Fragment>
                     );
                  }
                }
                return null;
              })}

              {(() => {
                const childrenPos = childrenRows.map(r => positions[r.relation]).filter(Boolean);
                if (childrenPos.length > 0) {
                    const childrenBusY = deceasedPos.y + LEVEL_GAP_Y * 0.75;
                    const minChildX = Math.min(...childrenPos.map(p => p.x + NODE_WIDTH/2));
                    const maxChildX = Math.max(...childrenPos.map(p => p.x + NODE_WIDTH/2));
                    return (
                      <React.Fragment key="children-lines">
                        <SvgPath d={`M ${deceasedPos.x + NODE_WIDTH / 2},${deceasedPos.y + NODE_HEIGHT} V ${childrenBusY}`} />
                        <SvgPath d={`M ${minChildX},${childrenBusY} H ${maxChildX}`} />
                        {childrenPos.map((cPos, i) => (
                           <SvgPath key={`c-line-${i}`} d={`M ${cPos.x + NODE_WIDTH / 2},${childrenBusY} V ${cPos.y}`} />
                        ))}
                      </React.Fragment>
                    );
                }
                return null;
              })()}
            </svg>

            {Object.entries(positions).map(([key, pos]) => {
              let heirData: any = { area: '', share: '', isDeceased: key.startsWith('Deceased') && key !== 'Deceased'};

              if (key === 'Deceased') {
                heirData = { area: totalAreaFormatted, share: '', isDeceased: true };
              } else {
                const mainRow = rows.find(r => r.relation === key);
                if (mainRow) {
                  heirData = { area: `${mainRow.kanal}K-${mainRow.marla}M-${mainRow.feet}ft`, share: mainRow.shareLabel, isDeceased: mainRow.relation.startsWith('Deceased') };
                } else {
                  for (const parentRow of rows) {
                    const subRow = parentRow.subRows?.find(sr => `${parentRow.relation}-${sr.relation}` === key);
                    if (subRow) {
                      heirData = { area: `${subRow.kanal}K-${subRow.marla}M-${subRow.feet}ft`, share: subRow.shareLabel };
                      break;
                    }
                  }
                }
              }
              if (!heirData.area) return null;

              return (
                <Draggable key={key} position={pos} onDrag={(e, data) => handleDrag(e, data, key)} cancel=".no-drag">
                  <div className="absolute cursor-move" style={{ zIndex: 10 }}>
                    <Node title={key.split('-').pop()!} area={heirData.area} share={heirData.share} isDeceased={heirData.isDeceased} />
                  </div>
                </Draggable>
              );
            })}
        </>
      )}
    </div>
  );
};

    