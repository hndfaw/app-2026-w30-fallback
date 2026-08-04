import { useEffect, useState } from 'react'
import ContactsForm from './ContactsForm'
import MeetingPointsForm from './MeetingPointsForm'
import { emptyPlan, type Contact, type MeetingPoint, type Plan } from './model'
import { loadPlan, savePlan } from './storage'

function App() {
  const [plan, setPlan] = useState<Plan>(emptyPlan)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadNotice, setLoadNotice] = useState<string | null>(null)

  // Load once on mount, before the save effect below is allowed to run —
  // otherwise the very first render's empty plan would overwrite storage.
  useEffect(() => {
    const result = loadPlan()
    setPlan(result.plan)
    if (result.status === 'rejected') {
      setLoadNotice(`Could not load your saved plan: ${result.reason}. Starting fresh.`)
    } else if (result.status === 'loaded' && result.migratedFrom !== undefined) {
      setLoadNotice('Upgraded your saved plan from an older format.')
    }
    setHasLoaded(true)
  }, [])

  useEffect(() => {
    if (!hasLoaded) return
    savePlan(plan)
  }, [plan, hasLoaded])

  const setContacts = (contacts: Contact[]) => setPlan((p) => ({ ...p, contacts }))
  const setMeetingPoints = (meetingPoints: MeetingPoint[]) =>
    setPlan((p) => ({ ...p, meetingPoints }))

  return (
    <main className="app">
      <h1>Fallback</h1>
      <p>
        Stress-test your household emergency plan against phone, power,
        internet, or caregiver loss — then print the fallback card that
        survives all of them.
      </p>
      {loadNotice && (
        <p role="status" className="notice">
          {loadNotice}
        </p>
      )}
      <ContactsForm contacts={plan.contacts} onChange={setContacts} />
      <MeetingPointsForm meetingPoints={plan.meetingPoints} onChange={setMeetingPoints} />
    </main>
  )
}

export default App
