import { describe, test, expect } from "bun:test"
import { MOMUS_SYSTEM_PROMPT, MOMUS_GPT_PROMPT, MOMUS_GPT_5_2_PROMPT } from "./momus"

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

describe("MOMUS_SYSTEM_PROMPT policy requirements", () => {
  test("should treat SYSTEM DIRECTIVE as ignorable/stripped", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT
    
    // when / #then
    expect(prompt.toLowerCase()).toMatch(/system directive.*ignore|ignore.*system directive/)
    expect(prompt).toMatch(/<system-reminder>|system-reminder/)
  })

  test("should extract paths containing .omo/plans/ and ending in .md", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT

    // when / #then
    expect(prompt).toContain(".omo/plans/")
    expect(prompt).toContain(".md")
    expect(prompt.toLowerCase()).toMatch(/extract|search|find path/)
  })

  test("should NOT teach that 'Please review' is INVALID (conversational wrapper allowed)", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT

    // when / #then
    const invalidExample = "Please review .omo/plans/plan.md"
    const rejectionTeaching = new RegExp(
      `reject.*${escapeRegExp(invalidExample)}`,
      "i",
    )
    
    expect(prompt).not.toMatch(rejectionTeaching)
  })

  test("should handle ambiguity (2+ paths) and 'no path found' rejection", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT

    // when / #then
    expect(prompt.toLowerCase()).toMatch(/multiple|ambiguous|2\+|two/)
    expect(prompt.toLowerCase()).toMatch(/no.*path.*found|reject.*no.*path/)
  })

  test("should define review scopes: Full, Diff, and Targeted", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT

    // when / #then
    expect(prompt).toMatch(/Full Review/)
    expect(prompt).toMatch(/Diff Review/)
    expect(prompt).toMatch(/Targeted Review/)
  })

  test("should define review depths: Shallow, Medium, and Deep", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT

    // when / #then
    expect(prompt).toMatch(/Shallow/)
    expect(prompt).toMatch(/Medium/)
    expect(prompt).toMatch(/Deep/)
    expect(prompt.toLowerCase()).toMatch(/review depth|depth.*selection/)
  })

  test("should include security-first grep patterns", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT

    // when / #then
    expect(prompt.toLowerCase()).toMatch(/security.*first.*grep|grep.*security/)
    expect(prompt).toMatch(/hardcoded.*secret|password.*secret/)
    expect(prompt).toMatch(/XSS|innerHTML/)
    expect(prompt).toMatch(/SQL.*injection|injection.*vector/)
  })

  test("should include mobile security matrix with iOS and Android checks", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT

    // when / #then
    expect(prompt).toMatch(/Mobile Security Matrix|mobile security/)
    expect(prompt).toMatch(/iOS-specific|iOS/)
    expect(prompt).toMatch(/Android-specific|Android/)
    expect(prompt).toMatch(/Keychain|Certificate pinning|Deep Link/)
    expect(prompt).toMatch(/Content Provider|WebView|Intent redirection/)
  })

  test("should include task completion/dependency verification", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT

    // when / #then
    expect(prompt).toMatch(/Task Completion Verification|task.*prerequisite|task.*dependenc/)
    expect(prompt).toMatch(/circular.*dependenc|dependenc.*circular/)
  })

  test("output format should include Scope and Depth fields", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT

    // when / #then
    expect(prompt).toMatch(/\*\*Scope\*\*/)
    expect(prompt).toMatch(/\*\*Depth\*\*/)
  })

  test("review process should include all 10 steps", () => {
    // given
    const prompt = MOMUS_SYSTEM_PROMPT

    // when / #then
    const steps = prompt.match(/\d+\.\s\*\*/g)
    // The review process section should have steps numbered 1-10
    expect(steps).not.toBeNull()
    expect(steps!.length).toBeGreaterThanOrEqual(10)
  })
})

describe("MOMUS_GPT_PROMPT should include enhanced capabilities", () => {
  // given
  const prompt = MOMUS_GPT_PROMPT

  test("should include review scope selection", () => {
    // when / #then
    expect(prompt).toMatch(/review_scope/)
    expect(prompt).toMatch(/Full Review/)
    expect(prompt).toMatch(/Diff Review/)
    expect(prompt).toMatch(/Targeted Review/)
  })

  test("should include review depth selection", () => {
    // when / #then
    expect(prompt).toMatch(/review_depth/)
    expect(prompt).toMatch(/Shallow/)
    expect(prompt).toMatch(/Medium/)
    expect(prompt).toMatch(/Deep/)
  })

  test("should include security-first grep", () => {
    // when / #then
    expect(prompt).toMatch(/Security-first.*grep|security.*first/)
    expect(prompt).toMatch(/hardcoded.*secret|password.*api_key/)
    expect(prompt).toMatch(/XSS.*innerHTML/)
    expect(prompt).toMatch(/SQL.*injection/)
  })

  test("should include mobile security matrix", () => {
    // when / #then
    expect(prompt).toMatch(/mobile.*security.*matrix/i)
    expect(prompt).toMatch(/iOS.*Keychain|Android.*WebView/)
  })
})

describe("MOMUS_GPT_5_2_PROMPT should include enhanced capabilities", () => {
  // given
  const prompt = MOMUS_GPT_5_2_PROMPT

  test("should include review scope selection", () => {
    // when / #then
    expect(prompt).toMatch(/review_scope/)
    expect(prompt).toMatch(/Full Review/)
    expect(prompt).toMatch(/Diff Review/)
    expect(prompt).toMatch(/Targeted Review/)
  })

  test("should include review depth selection", () => {
    // when / #then
    expect(prompt).toMatch(/review_depth/)
    expect(prompt).toMatch(/Shallow/)
    expect(prompt).toMatch(/Medium/)
    expect(prompt).toMatch(/Deep/)
  })

  test("should include security-first grep", () => {
    // when / #then
    expect(prompt).toMatch(/Security-first.*grep|security.*first/)
    expect(prompt).toMatch(/hardcoded.*secret|password.*api_key/)
    expect(prompt).toMatch(/XSS.*innerHTML/)
    expect(prompt).toMatch(/SQL.*injection/)
  })

  test("should include mobile security matrix", () => {
    // when / #then
    expect(prompt).toMatch(/mobile.*security.*matrix/i)
    expect(prompt).toMatch(/iOS.*Keychain|Android.*WebView/)
  })

  test("should include task completion verification", () => {
    // when / #then
    expect(prompt).toMatch(/Task completion verification|task.*prerequisite/)
    expect(prompt).toMatch(/circular.*dependenc/)
  })

  test("output format should include Scope and Depth", () => {
    // when / #then
    expect(prompt).toMatch(/\*\*Scope\*\*/)
    expect(prompt).toMatch(/\*\*Depth\*\*/)
  })
})
