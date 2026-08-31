// src/screens/Partners/index.tsx
//
// Who you rope with.
//
// Team roping is the only event in this portfolio where the entry has two
// people on it, and a roper's partner history is a thing they genuinely track:
// who you have entered with, what numbers the pair carried, and which division
// that put you in.
//
// The end you roped is derived rather than stored. `entries` has a
// `contestant_id` and a `partner_id`, and which is which depends on how the
// secretary took the entry — so "your partner" is simply the other id on the
// row, whichever column it sits in.

import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Screen } from '@/components/ui/Screen';
import { Stat } from '@/components/ui/Stat';
import { colors } from '@/constants/theme';
import { useSession } from '@/lib/auth';
import { getMyProfile, listMyPartnerEntries, namesFor, type PartnerEntry } from '@/lib/queries';

/** The other person on the entry, whichever column they are in. */
function partnerIdOf(entry: PartnerEntry, me: string): string | null {
  if (entry.contestant_id === me) return entry.partner_id;
  return entry.contestant_id;
}

function EntryCard({
  entry,
  me,
  names,
}: {
  entry: PartnerEntry;
  me: string;
  names: Record<string, string>;
}) {
  const partnerId = partnerIdOf(entry, me);
  const partnerName = partnerId ? (names[partnerId] ?? 'Roping partner') : 'Roping partner';
  const when = entry.rodeos
    ? new Date(`${entry.rodeos.start_date}T00:00:00`).toLocaleDateString()
    : new Date(entry.entered_at).toLocaleDateString();

  return (
    <Card
      title={partnerName}
      subtitle={[entry.rodeos?.name, when].filter(Boolean).join(' · ')}
    >
      <View style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
        {entry.division_name ? <Stat label="Division" value={entry.division_name} /> : null}
        {entry.header_number !== null ? (
          <Stat label="Header" value={String(entry.header_number)} />
        ) : null}
        {entry.heeler_number !== null ? (
          <Stat label="Heeler" value={String(entry.heeler_number)} />
        ) : null}
        {entry.combined_number !== null ? (
          <Stat
            label="Combined"
            value={String(entry.combined_number)}
            hint="Snapshotted at entry"
          />
        ) : null}
        <Stat label="Status" value={entry.status} />
      </View>
    </Card>
  );
}

export function PartnersScreen() {
  const { user } = useSession();

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getMyProfile(user!.id),
    enabled: Boolean(user?.id),
  });
  const profileId = profileQuery.data?.id;

  const entriesQuery = useQuery({
    queryKey: ['partner-entries', profileId],
    queryFn: () => listMyPartnerEntries(profileId!),
    enabled: Boolean(profileId),
  });

  const partnerIds = (entriesQuery.data ?? [])
    .map((e) => partnerIdOf(e, profileId ?? ''))
    .filter((id): id is string => Boolean(id));

  const namesQuery = useQuery({
    queryKey: ['names', [...new Set(partnerIds)].sort().join(',')],
    queryFn: () => namesFor(partnerIds),
    enabled: partnerIds.length > 0,
  });

  // How many times you have entered with each person. The question a roper
  // actually asks of this list is "who do I rope with most", and the answer is
  // not visible from a chronological feed alone.
  const counts = new Map<string, number>();
  for (const id of partnerIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const regulars = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Partners</Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
          Everyone you have entered with, and the numbers the pair carried at the time.
        </Text>
      </View>

      {regulars.length > 0 ? (
        <Card title="You rope with">
          <View style={{ gap: 6 }}>
            {regulars.map(([id, n]) => (
              <View key={id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontSize: 14 }}>
                  {namesQuery.data?.[id] ?? 'Roping partner'}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>
                  {n} {n === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <QueryBoundary
        isLoading={profileQuery.isLoading || entriesQuery.isLoading}
        error={profileQuery.error ?? entriesQuery.error}
        data={entriesQuery.data}
        onRetry={() => entriesQuery.refetch()}
        empty={
          <EmptyState
            title="No partners yet"
            body="Enter a roping with somebody and the pair shows up here — with the numbers you both carried on the day, which is what decides the division you were eligible for."
          />
        }
      >
        {(entries) => (
          <View style={{ gap: 12 }}>
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                me={profileId ?? ''}
                names={namesQuery.data ?? {}}
              />
            ))}
          </View>
        )}
      </QueryBoundary>
    </Screen>
  );
}
