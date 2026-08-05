// Critical items form (ticket 8): add, edit, remove items, and tag each
// with the channels or specific people it depends on.

import {
  CHANNELS,
  ITEM_CATEGORIES,
  channelDep,
  newCriticalItem,
  personDep,
  sameDependency,
  type Contact,
  type CriticalItem,
  type Dependency,
} from './model'

interface Props {
  items: CriticalItem[]
  contacts: Contact[]
  onChange: (items: CriticalItem[]) => void
}

function CriticalItemsForm({ items, contacts, onChange }: Props) {
  const update = (id: string, patch: Partial<Omit<CriticalItem, 'id'>>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const remove = (id: string) => {
    onChange(items.filter((item) => item.id !== id))
  }

  const add = () => {
    onChange([...items, newCriticalItem()])
  }

  const toggleDependency = (item: CriticalItem, dep: Dependency, checked: boolean) => {
    const dependencies = checked
      ? [...item.dependencies, dep]
      : item.dependencies.filter((d) => !sameDependency(d, dep))
    update(item.id, { dependencies })
  }

  return (
    <section aria-labelledby="critical-items-heading">
      <h2 id="critical-items-heading">Critical items</h2>
      <ul className="entry-list">
        {items.map((item) => (
          <li key={item.id} className="entry-row">
            <label>
              Name
              <input
                type="text"
                value={item.name}
                onChange={(e) => update(item.id, { name: e.target.value })}
              />
            </label>
            <label>
              Category
              <select
                value={item.category}
                onChange={(e) =>
                  update(item.id, { category: e.target.value as CriticalItem['category'] })
                }
              >
                {ITEM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notes
              <input
                type="text"
                value={item.notes}
                onChange={(e) => update(item.id, { notes: e.target.value })}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={item.essential}
                onChange={(e) => update(item.id, { essential: e.target.checked })}
              />
              Essential (on fallback card)
            </label>
            <fieldset>
              <legend>Depends on</legend>
              {CHANNELS.map((channel) => {
                const dep = channelDep(channel)
                const checked = item.dependencies.some((d) => sameDependency(d, dep))
                return (
                  <label key={channel} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleDependency(item, dep, e.target.checked)}
                    />
                    {channel}
                  </label>
                )
              })}
              {contacts.map((contact) => {
                const dep = personDep(contact.id)
                const checked = item.dependencies.some((d) => sameDependency(d, dep))
                return (
                  <label key={contact.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleDependency(item, dep, e.target.checked)}
                    />
                    {contact.name || 'Unnamed contact'}
                  </label>
                )
              })}
            </fieldset>
            <button type="button" onClick={() => remove(item.id)} aria-label={`Remove ${item.name || 'item'}`}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={add}>
        Add critical item
      </button>
    </section>
  )
}

export default CriticalItemsForm
