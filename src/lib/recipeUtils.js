const UNITS =
  // German
  'EL|TL|MSP|Bund(?:e|es)?|Prise(?:n)?|Stück(?:e|es)?|Scheibe(?:n)?' +
  '|Zehe(?:n)?|Dose(?:n)?|Glas|Gläser|Flasche(?:n)?|Packung(?:en)?' +
  '|Becher|Zweig(?:e)?|Blatt|Blätter|Paar|Pkt' +
  // Metric / English
  '|g|kg|ml|l|cl|dl|tbsp?|tsp?|cups?|oz|lbs?|pieces?|pcs?|slices?' +
  '|bunch(?:es)?|pinch(?:es)?|handful|packs?|cans?|jars?|bottles?|bags?|cm|mm'

const WITH_UNIT_RE = new RegExp(`^(\\d[\\d.,/]*\\s*(?:${UNITS})\\.?)\\s+(.+)`, 'i')
const PLAIN_NUM_RE = /^(\d[\d.,/]*)\s+(.+)/

export function parseIngredient(str) {
  const withUnit = str.match(WITH_UNIT_RE)
  if (withUnit) return { amount: withUnit[1].trim(), rest: withUnit[2] }

  const plain = str.match(PLAIN_NUM_RE)
  if (plain) return { amount: plain[1], rest: plain[2] }

  return { amount: '', rest: str }
}

// Injects missing ingredient amounts into step texts.
// For each ingredient with a parseable amount, finds the ingredient name in
// steps and prepends the amount where it is missing. Only touches the first
// matching step per ingredient. Uses a two-token lookback to detect amounts
// that are already present (handles "125 g Butter" vs a second "175 g Butter").
// Combined scaling + injection for cook mode.
// For each ingredient pair (original, scaled):
//   1. Replaces the original amount before the ingredient name in ALL steps
//      (handles both unit amounts like "200g" and plain counts like "2 Eier")
//   2. Falls back to injecting the scaled amount where the name appears without any amount
export function scaleAndRestoreAmountsInSteps(originalIngredients, scaledIngredients, steps) {
  let result = steps.slice()

  for (let i = 0; i < originalIngredients.length; i++) {
    const { amount: origAmt, rest: origRest } = parseIngredient(originalIngredients[i])
    const { amount: scaledAmt } = parseIngredient(scaledIngredients[i])

    if (!origRest) continue
    const ingName = origRest.replace(/^(?:of|von|aus|mit)\s+/i, '').trim()
    if (ingName.length < 2) continue
    const ingNameFirst = ingName.split(/\s+/)[0]

    // Step 1: replace original amount before ingredient name (handles all amount types)
    if (origAmt && scaledAmt && origAmt !== scaledAmt) {
      const tryReplace = (name) => {
        const search = (origAmt + ' ' + name).toLowerCase()
        let found = false
        const updated = result.map(step => {
          let s = step, lo = s.toLowerCase(), idx = lo.indexOf(search)
          while (idx !== -1) {
            s = s.slice(0, idx) + scaledAmt + s.slice(idx + origAmt.length)
            lo = s.toLowerCase()
            idx = lo.indexOf(search, idx + scaledAmt.length)
            found = true
          }
          return s
        })
        return found ? updated : null
      }
      const r = tryReplace(ingName) || (ingNameFirst !== ingName && tryReplace(ingNameFirst))
      if (r) { result = r; continue }
    }

    if (!scaledAmt) continue

    // Step 2: skip if scaled amount already present somewhere
    const alreadyPresent = (name) => result.some(s => {
      const lo = s.toLowerCase()
      return lo.includes((scaledAmt + ' ' + name).toLowerCase()) ||
             lo.includes((scaledAmt + name).toLowerCase())
    })
    if (alreadyPresent(ingName) || (ingNameFirst !== ingName && alreadyPresent(ingNameFirst))) continue

    // Step 3: inject scaled amount where ingredient name appears without a preceding amount
    const tryInject = (name) => {
      const lowerName = name.toLowerCase()
      let injected = false
      const updated = result.map(step => {
        if (injected) return step
        const lowerStep = step.toLowerCase()
        const idx = lowerStep.indexOf(lowerName)
        if (idx === -1) return step
        const charBefore = idx > 0 ? step[idx - 1] : ' '
        const charAfter = step[idx + name.length] || ' '
        if (/[a-zA-ZäöüÄÖÜß]/.test(charBefore)) return step
        if (/[a-zA-ZäöüÄÖÜß]/.test(charAfter)) return step
        const textBefore = step.substring(0, idx).trimEnd()
        const recentTokens = textBefore.split(/\s+/).slice(-2)
        if (recentTokens.some(t => /\d/.test(t))) return step
        injected = true
        return step.substring(0, idx) + scaledAmt + ' ' + step.substring(idx)
      })
      return injected ? updated : null
    }
    const withFull = tryInject(ingName)
    if (withFull) { result = withFull; continue }
    if (ingNameFirst !== ingName) {
      const withFirst = tryInject(ingNameFirst)
      if (withFirst) result = withFirst
    }
  }
  return result
}

export function restoreAmountsInSteps(ingredients, steps) {
  let result = steps.slice()

  for (const ing of ingredients) {
    const { amount, rest } = parseIngredient(ing)
    if (!amount || !rest) continue
    const ingName = rest.replace(/^(?:of|von|aus|mit)\s+/i, '').trim()
    if (ingName.length < 2) continue
    const ingNameFirst = ingName.split(/\s+/)[0]

    const alreadyPresent = (name) => result.some(s => {
      const lower = s.toLowerCase()
      return lower.includes((amount + ' ' + name).toLowerCase()) ||
             lower.includes((amount + name).toLowerCase())
    })
    if (alreadyPresent(ingName) || (ingNameFirst !== ingName && alreadyPresent(ingNameFirst))) continue

    const tryInject = (name) => {
      const lowerName = name.toLowerCase()
      let injected = false
      const updated = result.map(step => {
        if (injected) return step
        const lowerStep = step.toLowerCase()
        const idx = lowerStep.indexOf(lowerName)
        if (idx === -1) return step
        const charBefore = idx > 0 ? step[idx - 1] : ' '
        const charAfter = step[idx + name.length] || ' '
        // Must be a word boundary on both sides
        if (/[a-zA-ZäöüÄÖÜß]/.test(charBefore)) return step
        if (/[a-zA-ZäöüÄÖÜß]/.test(charAfter)) return step
        // Skip if either of the two tokens immediately before this word contain a
        // digit — that means an amount is already there (e.g. "125 g Butter")
        const textBefore = step.substring(0, idx).trimEnd()
        const recentTokens = textBefore.split(/\s+/).slice(-2)
        if (recentTokens.some(t => /\d/.test(t))) return step
        injected = true
        return step.substring(0, idx) + amount + ' ' + step.substring(idx)
      })
      return injected ? updated : null
    }

    const withFull = tryInject(ingName)
    if (withFull) { result = withFull; continue }
    if (ingNameFirst !== ingName) {
      const withFirst = tryInject(ingNameFirst)
      if (withFirst) result = withFirst
    }
  }
  return result
}
