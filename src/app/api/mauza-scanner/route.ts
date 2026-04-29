
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * CATEGORY_MAPPING - Replicated from Python Reference
 * Fuzzy keywords to detect specific land record categories
 */
const CATEGORY_MAPPING: Record<string, string[]> = {
    'Mutation': ['mutation', 'mutations', 'انتقال', 'intiqal', 'interum', 'intaram', 'motation', 'mutaion'],
    'RHZ': ['rhz', 'roznamcha', 'روزنامچہ'],
    'Shajra': ['shajra', 'شجرہ', 'shijra', 'map'],
    'Fardbadar': ['fardbadar', 'fard badar', 'فرد بدر', 'بدرات'],
    'Field Book': ['field book', 'fieldbook', 'فیلڈ بک']
};

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp', '.gif']);

/**
 * detectCategory - Logic Translation from Python
 * Scans relative path for keywords or falls back to parent folder name
 */
function detectCategory(filePath: string, baseMauzaPath: string): string {
    const relPath = path.relative(baseMauzaPath, filePath).toLowerCase();
    
    // 1. HUNTING MODE: Deep Path Scan
    for (const [standardCat, keywords] of Object.entries(CATEGORY_MAPPING)) {
        if (keywords.some(kw => relPath.includes(kw.toLowerCase()))) {
            return standardCat;
        }
    }

    // 2. DYNAMIC DISCOVERY (Fallback)
    const parentDir = path.basename(path.dirname(filePath));
    const fullParentDir = path.dirname(filePath);
    
    // If the image was in the root
    if (path.resolve(fullParentDir) === path.resolve(baseMauzaPath)) {
        return "Uncategorized Root Files";
    }
        
    return parentDir.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

/**
 * Recursive File Scanner
 */
async function scanDirectory(dir: string, base: string, stats: Record<string, number>) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const res = path.resolve(dir, entry.name);
            if (entry.isDirectory()) {
                await scanDirectory(res, base, stats);
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (IMAGE_EXTENSIONS.has(ext)) {
                    const category = detectCategory(res, base);
                    stats[category] = (stats[category] || 0) + 1;
                }
            }
        }
    } catch (err) {
        console.error(`Error scanning ${dir}:`, err);
        throw err;
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { targets, serverSavePath } = body as { targets: { name: string, path: string }[], serverSavePath?: string };

        if (!targets || !Array.isArray(targets)) {
            return NextResponse.json({ success: false, error: "Invalid targets provided." }, { status: 400 });
        }

        const results = [];

        // Run scans in parallel with error isolation
        const scanPromises = targets.map(async (target) => {
            const stats: Record<string, number> = {};
            try {
                // Quick existence check
                await fs.access(target.path);
                await scanDirectory(target.path, target.path, stats);
                return { name: target.name, path: target.path, stats, status: 'success' };
            } catch (err: any) {
                return { name: target.name, path: target.path, error: err.message, status: 'failed' };
            }
        });

        const scanResults = await Promise.all(scanPromises);

        // Optional: Save to Server Path
        if (serverSavePath && scanResults.length > 0) {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filePath = path.join(serverSavePath, `mauza_scan_${timestamp}.csv`);
                
                // Get all unique headers
                const allKeys = new Set<string>();
                scanResults.forEach(r => {
                    if (r.stats) Object.keys(r.stats).forEach(k => allKeys.add(k));
                });
                const headers = ['Mauza Name', 'Path', 'Status', ...Array.from(allKeys)];
                
                const csvContent = [
                    headers.join(','),
                    ...scanResults.map(r => {
                        const row = [r.name, r.path, r.status];
                        Array.from(allKeys).forEach(k => row.push(String(r.stats?.[k] || 0)));
                        return row.join(',');
                    })
                ].join('\n');

                await fs.mkdir(serverSavePath, { recursive: true });
                await fs.writeFile(filePath, csvContent);
                console.log(`Report saved to ${filePath}`);
            } catch (err) {
                console.error("Failed to save report to server path:", err);
            }
        }

        return NextResponse.json({ success: true, data: scanResults });

    } catch (error: any) {
        console.error('API Mauza Scanner Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
