import React from 'react';
import { RoadmapCard } from './RoadmapCard';
import { TaskCard } from './TaskCard';
import type { MessageArtifact } from '@/types';

export { RoadmapCard } from './RoadmapCard';
export { TaskCard } from './TaskCard';
export { MilestoneRow } from './MilestoneRow';

/**
 * Renders a structured artifact attached to a chat message, so plans and tasks
 * appear as beautiful cards directly inside the conversation thread.
 */
export function ArtifactRenderer({
  artifact,
  onOpenPlan,
}: {
  artifact: MessageArtifact;
  onOpenPlan?: () => void;
}) {
  switch (artifact.type) {
    case 'roadmap':
      return <RoadmapCard roadmap={artifact.roadmap} compact onOpenPlan={onOpenPlan} />;
    case 'tasks':
      return (
        <>
          {artifact.tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </>
      );
    default:
      return null;
  }
}
