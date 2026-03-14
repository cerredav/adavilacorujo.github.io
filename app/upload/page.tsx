'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExpenseStore } from '@/store/expense-store';

const accepted = ['application/pdf', 'image/png', 'image/jpeg'];

export default function UploadPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploads = useExpenseStore((s) => s.uploads);
  const addUploadFiles = useExpenseStore((s) => s.addUploadFiles);

  const queueFiles = async (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((file) => accepted.includes(file.type));
    if (valid.length === 0) {
      toast.error('No valid files. Use PDF, PNG, JPG.');
      return;
    }
    await addUploadFiles(valid);
    toast.success(`${valid.length} file(s) uploaded.`);
  };

  return (
    <div className="grid">
      <h1>Upload Receipts</h1>
      <Card
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void queueFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        style={{ borderStyle: 'dashed', borderColor: isDragging ? '#0f172a' : '#cbd5e1', textAlign: 'center' }}
      >
        <p>Drag and drop receipts here</p>
        <p>PDF, PNG, JPG • multiple files allowed</p>
        <input
          data-testid="file-input"
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
          onChange={(e) => void queueFiles(e.target.files)}
        />
        <Button onClick={() => fileRef.current?.click()}>Choose files</Button>
      </Card>

      {uploads.length === 0 && <Card>Nothing uploaded yet.</Card>}

      {uploads.map((u) => (
        <Card key={u.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <strong>{u.fileName}</strong>
              <div>{u.type} • {(u.size / 1024).toFixed(1)} KB</div>
            </div>
            <Badge
              label={u.status}
              tone={u.status === 'Completed' ? 'success' : u.status === 'Needs Review' ? 'warning' : u.status === 'Failed' ? 'danger' : 'default'}
            />
          </div>
          <div style={{ height: 10, background: '#e2e8f0', borderRadius: 999, marginTop: 10 }}>
            <div style={{ height: 10, width: `${u.progress}%`, background: '#0f172a', borderRadius: 999 }} />
          </div>
          {u.status === 'Processing' && <div className="skeleton" style={{ height: 14, width: '40%', marginTop: 8 }} />}
          {u.error && <p style={{ color: '#dc2626', marginTop: 8 }}>{u.error}</p>}
          {u.expenseId && (
            <Link href={`/expenses/${u.expenseId}`} style={{ marginTop: 8, display: 'inline-block' }}>
              Open extracted expense
            </Link>
          )}
        </Card>
      ))}
    </div>
  );
}
