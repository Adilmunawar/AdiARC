import Papa from 'papaparse';
import type { InventoryItem } from '@/types';

export function downloadCSV(data: InventoryItem[], filename: string) {
  const validData = data
    .filter((item) => item.status === 'Valid' && item.id)
    .map(({ id, fileName, sourceTag }) => ({
      'Mutation ID': id,
      'File Name': fileName,
      'Source Tag': sourceTag,
    }));

  if (validData.length === 0) {
    alert('No valid items to download.');
    return;
  }

  const csv = Papa.unparse(validData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
