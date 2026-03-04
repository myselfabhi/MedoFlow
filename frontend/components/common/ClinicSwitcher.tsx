'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClinic } from '@/contexts/ClinicContext';
import { Building2 } from 'lucide-react';

export function ClinicSwitcher() {
  const { selectedClinicId, setSelectedClinicId, clinics, isLoading } = useClinic();

  if (isLoading || clinics.length === 0) return null;

  return (
    <Select
      value={selectedClinicId ?? ''}
      onValueChange={(v) => setSelectedClinicId(v || null)}
    >
      <SelectTrigger className="w-[200px] h-9">
        <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Select clinic" />
      </SelectTrigger>
      <SelectContent>
        {clinics.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
