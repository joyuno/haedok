'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsageStore } from '@/stores/usageStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { parseCSV, type ParsedUsageEntry } from '@/lib/utils/csvParser';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { BrandIcon } from '@/components/subscription/BrandIcon';

interface CsvUploaderProps {
  onComplete?: () => void;
}

export function CsvUploader({ onComplete }: CsvUploaderProps) {
  const { subscriptions } = useSubscriptionStore();
  const { importFromCSV } = useUsageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedEntries, setParsedEntries] = useState<ParsedUsageEntry[]>([]);
  const [format, setFormat] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      handleFile(droppedFile);
    } else {
      alert('CSV 파일만 업로드 가능합니다.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleFile = async (file: File) => {
    setFile(file);
    setErrors([]);
    setParsedEntries([]);
    setMapping({});
    setImportResult(null);

    try {
      const text = await file.text();
      const result = parseCSV(text);

      setParsedEntries(result.entries);
      setFormat(result.format);
      setErrors(result.errors);

      // Auto-map if service names match
      const autoMapping: Record<string, string> = {};
      result.entries.forEach((entry) => {
        const matchingSub = subscriptions.find(
          (sub) =>
            sub.name.toLowerCase() === entry.appName.toLowerCase() ||
            entry.appName.toLowerCase().includes(sub.name.toLowerCase()) ||
            sub.name.toLowerCase().includes(entry.appName.toLowerCase()),
        );
        if (matchingSub) {
          autoMapping[entry.appName] = matchingSub.id;
        }
      });
      setMapping(autoMapping);
    } catch (err) {
      setErrors(['파일을 읽을 수 없습니다.']);
    }
  };

  const handleImport = () => {
    setImporting(true);
    const count = importFromCSV(parsedEntries, mapping);
    setImportResult(count);
    setImporting(false);
    if (count > 0) {
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    }
  };

  const uniqueAppNames = Array.from(
    new Set(parsedEntries.map((e) => e.appName)),
  );

  const unmappedCount = uniqueAppNames.filter(name => !mapping[name]).length;

  const handleDownloadTemplate = () => {
    const activeNames = subscriptions
      .filter((s) => s.status === 'active' || s.status === 'trial')
      .map((s) => s.name);

    const header = 'App Name,Date,Usage Time';
    const today = new Date().toISOString().split('T')[0];

    const exampleTimes = ['3h 30m', '5h 0m', '1h 45m', '7h 0m', '2h 15m', '4h 0m'];

    const rows = activeNames.length > 0
      ? activeNames.map((name, i) => `${name},${today},${exampleTimes[i % exampleTimes.length]}`)
      : [
          `넷플릭스,${today},3h 30m`,
          `유튜브 프리미엄,${today},7h 0m`,
          `스포티파이,${today},5h 0m`
        ];

    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscout_usage_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV 파일로 일괄 입력</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          ActionDash 또는 StayFree 앱에서 내보낸 CSV 파일을 업로드하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file && (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
              role="button"
              tabIndex={0}
              aria-label="CSV 파일을 드래그하거나 클릭하여 선택"
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
              <p className="text-lg font-medium mb-2">
                CSV 파일을 드래그하거나 클릭하여 선택하세요
              </p>
              <p className="text-sm text-muted-foreground">
                ActionDash / StayFree 형식 지원
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV 양식 다운로드
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="CSV 파일 선택"
            />
          </>
        )}

        {file && parsedEntries.length > 0 && (
          <>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {parsedEntries.length}개 데이터 ({format} 형식)
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setParsedEntries([]);
                  setMapping({});
                }}
              >
                다시 선택
              </Button>
            </div>

            {errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900 dark:text-red-300 mb-1">오류 발생</p>
                    <ul className="text-sm text-red-800 dark:text-red-400 space-y-1">
                      {errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">앱 이름 매칭</h4>
              <p className="text-xs text-muted-foreground">
                CSV의 앱 이름과 등록된 구독을 연결해주세요
              </p>
              {unmappedCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    {unmappedCount}개 앱이 매칭되지 않았습니다. 매칭되지 않은 앱의 데이터는 가져오지 않습니다.
                  </p>
                </div>
              )}
              {uniqueAppNames.map((appName) => (
                <div key={appName} className="flex items-center gap-3">
                  <div className="flex-1 font-medium text-sm">{appName}</div>
                  <Select
                    value={mapping[appName] || ''}
                    onValueChange={(value) =>
                      setMapping((prev) => ({ ...prev, [appName]: value }))
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="구독 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptions.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          <div className="flex items-center gap-2">
                            <BrandIcon name={sub.name} icon={sub.icon} size="sm" />
                            <span>{sub.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {importing && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  데이터를 가져오는 중...
                </p>
                <Progress value={50} />
              </div>
            )}

            {importResult !== null && (
              <div className="p-3 bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-300">
                      가져오기 완료!
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-400">
                      {importResult}개 데이터를 성공적으로 가져왔습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleImport}
              disabled={
                importing ||
                importResult !== null ||
                Object.keys(mapping).length === 0
              }
            >
              {importing
                ? '가져오는 중...'
                : importResult !== null
                  ? '완료'
                  : `${Object.keys(mapping).length}/${uniqueAppNames.length}개 앱 데이터 가져오기`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
