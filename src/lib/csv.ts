// CSV export utilities

interface ParticipantData {
  name: string;
  birth_date: string;
  member_type: string;
  golf_attendance: string;
  golf_comment: string;
  celebration_attendance: string;
  celebration_comment: string;
}

/**
 * Convert participant data to CSV format
 */
export function convertToCSV(
  participants: ParticipantData[],
  hasCelebration: boolean
): string {
  // CSV header
  const headers = [
    '氏名',
    '生年月日',
    '区分',
    'コンペ参加',
    'コンペコメント',
  ];

  if (hasCelebration) {
    headers.push('祝賀会参加', '祝賀会コメント');
  }

  // CSV rows
  const rows = participants.map(p => {
    const row = [
      p.name,
      p.birth_date,
      p.member_type,
      p.golf_attendance,
      `"${(p.golf_comment || '').replace(/"/g, '""')}"`, // Escape double quotes
    ];

    if (hasCelebration) {
      row.push(
        p.celebration_attendance,
        `"${(p.celebration_comment || '').replace(/"/g, '""')}"`
      );
    }

    return row.join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for proper UTF-8 encoding in Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
