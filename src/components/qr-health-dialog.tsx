'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ActionIcon, Button, Group, Modal, Pagination, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { QrCode } from 'lucide-react';
import { useQRHealth } from '@/hooks/use-qr-health';

export function QRHealthDialog() {
  const [opened, setOpened] = useState(false);
  const [page, setPage] = useState(1);
  const { report, error, busy, run } = useQRHealth();
  return <>
    <Tooltip label="QR Health" withArrow position="top">
      <ActionIcon
        variant="default"
        radius="md"
        size={36}
        aria-label="QR health"
        onClick={() => setOpened(true)}
      >
        <QrCode size={16}/>
      </ActionIcon>
    </Tooltip>
    <Modal opened={opened} onClose={() => setOpened(false)} title="QR health" centered radius="lg" size="lg"
      overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
      classNames={{ content: 'bg-white/95 dark:bg-[#141a23]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100', header: 'bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200 dark:border-white/10 p-3', body: '!p-3' }}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">Check product identities and QR links. This report does not change inventory.</Text>
        <Group justify="space-between"><Button variant="default" mih={44} loading={busy} onClick={() => { setPage(1); void run(); }}>{report ? 'Refresh report' : 'Run report'}</Button>
          <Text size="xs" c="dimmed">Results may be reused for up to one minute.</Text></Group>
        {error && <Text role="alert" c="red" size="sm">{error}</Text>}
        {report && <>
          <Text size="xs" c="dimmed">Last completed audit: {new Date(report.completedAt).toLocaleString()}{error ? ' (previous result)' : ''}</Text>
          <Paper withBorder radius="lg" p="sm" className="!p-3 bg-slate-50 dark:bg-[#111722] border-slate-200 dark:border-white/10">
            <Stack gap="xs"><Text size="sm" fw={600}>{report.issues.length ? `${report.issues.length} issues need review` : 'No identity or mapping issues found'}</Text>
              <Text size="sm">{report.products} products · {report.archived} archived · {report.disabled} disabled QR links</Text>
              <Text size="xs" c="dimmed">Archived products and intentionally disabled links are counted separately from mapping issues.</Text></Stack>
          </Paper>
          {report.issues.slice((page - 1) * 8, page * 8).map((issue, index) => <Paper key={`${issue.path}-${issue.code}-${index}`} withBorder radius="md" p="sm" className="!p-3 border-slate-200 dark:border-white/10">
            <Stack gap={4}><Text size="sm" fw={600} className="break-words">{issue.name}</Text><Text size="sm">{issue.message}</Text>
              {issue.href ? <Button component={Link} href={issue.href} variant="subtle" size="xs" mih={44} onClick={() => setOpened(false)}>View item</Button>
                : <Text size="xs" c="dimmed" className="break-all">Record: {issue.path}</Text>}</Stack>
          </Paper>)}
          {report.issues.length > 8 && <Pagination value={page} onChange={setPage} total={Math.ceil(report.issues.length / 8)} size="md" siblings={0} boundaries={1} withControls={false} styles={{ control: { minWidth: 44, height: 44 } }}/>}
        </>}
      </Stack>
    </Modal>
  </>;
}
