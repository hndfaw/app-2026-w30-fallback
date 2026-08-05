// Meeting points form (ticket 7): add, edit, and remove places to meet.

import { newMeetingPoint, type MeetingPoint } from './model'

interface Props {
  meetingPoints: MeetingPoint[]
  onChange: (meetingPoints: MeetingPoint[]) => void
}

function MeetingPointsForm({ meetingPoints, onChange }: Props) {
  const update = (id: string, patch: Partial<Omit<MeetingPoint, 'id'>>) => {
    onChange(meetingPoints.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const remove = (id: string) => {
    onChange(meetingPoints.filter((p) => p.id !== id))
  }

  const add = () => {
    onChange([...meetingPoints, newMeetingPoint()])
  }

  return (
    <section aria-labelledby="meeting-points-heading">
      <h2 id="meeting-points-heading">Meeting points</h2>
      <ul className="entry-list">
        {meetingPoints.map((point) => (
          <li key={point.id} className="entry-row">
            <label>
              Label
              <input
                type="text"
                value={point.label}
                onChange={(e) => update(point.id, { label: e.target.value })}
              />
            </label>
            <label>
              Address
              <input
                type="text"
                value={point.address}
                onChange={(e) => update(point.id, { address: e.target.value })}
              />
            </label>
            <label>
              Notes
              <input
                type="text"
                value={point.notes}
                onChange={(e) => update(point.id, { notes: e.target.value })}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={point.essential}
                onChange={(e) => update(point.id, { essential: e.target.checked })}
              />
              Essential (on fallback card)
            </label>
            <button type="button" onClick={() => remove(point.id)} aria-label={`Remove ${point.label || 'meeting point'}`}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={add}>
        Add meeting point
      </button>
    </section>
  )
}

export default MeetingPointsForm
