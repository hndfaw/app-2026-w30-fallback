// Contacts form (ticket 7): add, edit, and remove people to reach.

import { newContact, type Contact } from './model'

interface Props {
  contacts: Contact[]
  onChange: (contacts: Contact[]) => void
}

function ContactsForm({ contacts, onChange }: Props) {
  const update = (id: string, patch: Partial<Omit<Contact, 'id'>>) => {
    onChange(contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const remove = (id: string) => {
    onChange(contacts.filter((c) => c.id !== id))
  }

  const add = () => {
    onChange([...contacts, newContact()])
  }

  return (
    <section aria-labelledby="contacts-heading">
      <h2 id="contacts-heading">Contacts</h2>
      <ul className="entry-list">
        {contacts.map((contact) => (
          <li key={contact.id} className="entry-row">
            <label>
              Name
              <input
                type="text"
                value={contact.name}
                onChange={(e) => update(contact.id, { name: e.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                type="text"
                value={contact.phone}
                onChange={(e) => update(contact.id, { phone: e.target.value })}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={contact.memorized}
                onChange={(e) => update(contact.id, { memorized: e.target.checked })}
              />
              Memorized or written down offline
            </label>
            <label>
              Notes
              <input
                type="text"
                value={contact.notes}
                onChange={(e) => update(contact.id, { notes: e.target.value })}
              />
            </label>
            <button type="button" onClick={() => remove(contact.id)} aria-label={`Remove ${contact.name || 'contact'}`}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={add}>
        Add contact
      </button>
    </section>
  )
}

export default ContactsForm
