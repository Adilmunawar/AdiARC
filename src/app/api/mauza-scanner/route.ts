
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
 * Recursive File Scanner with Concurrency Limit
 */
async function scanDirectory(dir: string, base: string, stats: Record<string, number>) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        // Process entries in smaller chunks to avoid EMFILE
        const CHUNK_SIZE = 50;
        for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
            const chunk = entries.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (entry) => {
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
            }));
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

        // Parallel scan with result isolation
        const scanResults = await Promise.all(targets.map(async (target) => {
            const stats: Record<string, number> = {};
            try {
                // Handle Windows-style network paths correctly
                const normalizedPath = target.path.replace(/\//g, path.sep).replace(/\\/g, path.sep);
                await fs.access(normalizedPath);
                await scanDirectory(normalizedPath, normalizedPath, stats);
                return { name: target.name, path: normalizedPath, stats, status: 'success' };
            } catch (err: any) {
                return { name: target.name, path: target.path, error: err.message, status: 'failed' };
            }
        }));

        // Optional: Save to Server Path (Default provided in Frontend)
        if (serverSavePath && scanResults.length > 0) {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filePath = path.join(serverSavePath, `mauza_scan_${timestamp}.csv`);
                
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

                // Try to create directory if it doesn't exist
                try {
                    await fs.mkdir(serverSavePath, { recursive: true });
                } catch (e) {
                    console.warn("Could not create directory, might already exist or permission denied.");
                }
                
                await fs.writeFile(filePath, csvContent);
                console.log(`Report saved to server at: ${filePath}`);
            } catch (err) {
                console.error("Failed to save report to host machine:", err);
            }
        }

        return NextResponse.json({ success: true, data: scanResults });

    } catch (error: any) {
        console.error('API Mauza Scanner Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
