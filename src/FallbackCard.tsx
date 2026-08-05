// Printable fallback card (ticket 10): the essentials — contacts, meeting
// points, and critical items marked "essential" in the forms above — laid
// out for two print targets: a full fridge copy and a compact wallet copy.
// Print CSS (index.css) hides everything else on the page when printing.

import type { Contact, CriticalItem, MeetingPoint, Plan } from './model'

interface Props {
  plan: Plan
}

interface CardProps {
  variant: 'fridge' | 'wallet'
  contacts: Contact[]
  meetingPoints: MeetingPoint[]
  items: CriticalItem[]
}

function Card({ variant, contacts, meetingPoints, items }: CardProps) {
  const compact = variant === 'wallet'
  const title = compact ? 'Fallback card — wallet copy' : 'Fallback card — fridge copy'

  return (
    <div className={`fallback-card fallback-card--${variant}`}>
      <h3>{title}</h3>
      {contacts.length > 0 && (
        <div className="fallback-card-group">
          <h4>Contacts</h4>
          <ul>
            {contacts.map((contact) => (
              <li key={contact.id}>
                {contact.name || 'Unnamed contact'}
                {contact.phone && ` — ${contact.phone}`}
                {!compact && contact.notes && ` (${contact.notes})`}
              </li>
            ))}
          </ul>
        </div>
      )}
      {meetingPoints.length > 0 && (
        <div className="fallback-card-group">
          <h4>Meeting points</h4>
          <ul>
            {meetingPoints.map((point) => (
              <li key={point.id}>
                {point.label || 'Unnamed meeting point'}
                {point.address && ` — ${point.address}`}
                {!compact && point.notes && ` (${point.notes})`}
              </li>
            ))}
          </ul>
        </div>
      )}
      {items.length > 0 && (
        <div className="fallback-card-group">
          <h4>Critical items</h4>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                {item.name || 'Unnamed item'}
                {!compact && ` (${item.category})`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FallbackCard({ plan }: Props) {
  const contacts = plan.contacts.filter((c) => c.essential)
  const meetingPoints = plan.meetingPoints.filter((p) => p.essential)
  const items = plan.items.filter((i) => i.essential)
  const hasEssentials = contacts.length > 0 || meetingPoints.length > 0 || items.length > 0

  return (
    <section className="fallback-card-section" aria-labelledby="fallback-card-heading">
      <h2 id="fallback-card-heading">Fallback card</h2>
      {hasEssentials ? (
        <>
          <p>
            Print a copy for the fridge and one for a wallet. Mark or unmark
            "Essential" above to change what's on it.
          </p>
          <button type="button" onClick={() => window.print()}>
            Print fallback card
          </button>
          <Card variant="fridge" contacts={contacts} meetingPoints={meetingPoints} items={items} />
          <Card variant="wallet" contacts={contacts} meetingPoints={meetingPoints} items={items} />
        </>
      ) : (
        <p>
          Nothing marked essential yet — check "Essential" on any contact,
          meeting point, or critical item above to put it on the card.
        </p>
      )}
    </section>
  )
}

export default FallbackCard
