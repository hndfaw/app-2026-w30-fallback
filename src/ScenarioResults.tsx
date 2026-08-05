// Scenario results UI (ticket 9): per-scenario pass/fail with a concrete gap
// list, so a household can see exactly what breaks under each stress test.

import { dependencyLabel } from './spof'
import { scenarioLabel, stressTest, type Gap, type Scenario } from './stress'
import type { Plan } from './model'

interface Props {
  plan: Plan
}

function scenarioKey(scenario: Scenario): string {
  return scenario.kind === 'channel' ? `channel:${scenario.channel}` : `person:${scenario.contactId}`
}

function gapText(gap: Gap, plan: Plan): string {
  if (gap.kind === 'contact') {
    return `${gap.contact.name.trim() || 'Unnamed contact'} becomes unreachable`
  }
  const deps = gap.broken.map((dep) => dependencyLabel(dep, plan)).join(', ')
  return `${gap.item.name.trim() || 'Unnamed item'} fails — depends on ${deps}`
}

function ScenarioResults({ plan }: Props) {
  const results = stressTest(plan)

  return (
    <section aria-labelledby="scenario-results-heading">
      <h2 id="scenario-results-heading">Stress test results</h2>
      <ul className="scenario-list">
        {results.map((result) => (
          <li
            key={scenarioKey(result.scenario)}
            className={`scenario-row ${result.pass ? 'scenario-pass' : 'scenario-fail'}`}
          >
            <h3>
              {scenarioLabel(result.scenario, plan)} —{' '}
              <span className="scenario-status">{result.pass ? 'Pass' : 'Fail'}</span>
            </h3>
            {result.pass ? (
              <p>Everything critical still works.</p>
            ) : (
              <ul className="gap-list">
                {result.gaps.map((gap, i) => (
                  <li key={i}>{gapText(gap, plan)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ScenarioResults
