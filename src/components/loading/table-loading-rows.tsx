'use client';
import { Table, Text } from '@mantine/core';
import { Skeleton } from '@/components/ui/skeleton';

export function TableLoadingRows({count=8, columns=6}: {count?:number;columns?:number}) {
  return <>{Array.from({length:count},(_,row)=><Table.Tr key={row} aria-hidden="true">
    {Array.from({length:columns},(_,cell)=><Table.Td key={cell}>
      <Skeleton><Text size="sm">Loading</Text>{cell === 0 && <Text size="xs">Account details</Text>}</Skeleton>
    </Table.Td>)}
  </Table.Tr>)}</>;
}
