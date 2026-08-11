import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
export function PartnersScreen() {
  return (
    <Screen>
      <EmptyState
        title={"Find a partner"}
        body={"Search by number, by end, and by what division the pair would land in — with the floor and cap rules checked before you enter."}
        actionLabel={"Search ropers"}
      />
    </Screen>
  );
}
