import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100'
const bank = JSON.parse(fs.readFileSync(new URL('../lib/question-bank.json', import.meta.url)))
const manifest = JSON.parse(fs.readFileSync(new URL('../public/question-bank/manifest.json', import.meta.url)))
assert.equal(bank.length, 41)
assert.equal(bank.filter(set => !set.duplicateOf).length, 33)
const pages = bank.flatMap(set => [set.task1.sourcePage, set.task2.sourcePage]).sort((a, b) => a - b)
assert.deepEqual(pages, Array.from({ length: 83 }, (_, i) => i + 1).filter(page => page !== 43))
assert.equal(manifest.taskPages, pages.length)
assert.equal(new Set(bank.map(set => set.title)).size, 41)
for (const set of bank) {
  for (const task of [set.task1, set.task2]) {
    assert.ok(task.width >= 1500 && task.height >= 2200)
    assert.ok(task.prompt.includes('Write at least'))
    const file = new URL(`../public${task.image}`, import.meta.url)
    assert.ok(fs.statSync(file).size > 10000)
    const response = await fetch(base + task.image)
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /image\/webp/)
  }
}
console.log('PASS: all 82 original question images, page coverage, pair IDs, repeated-pair labels and image dimensions.')

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('pageerror', error => runtimeErrors.push(error.message))
  const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'teacher@example.test', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now()/1000)+3600 })}.test-only-signature`
  let stored = []
  let rejectInsert = false
  let writes = 0
  let staleList = false
  let legacyExam = false
  let submitted = null
  const fromSet = set => ({ id: set.id, title: set.title, task1_prompt: `${set.task1.prompt}\n\n[Original question page](${set.task1.image})`, task2_prompt: `${set.task2.prompt}\n\n[Original question page](${set.task2.image})`, task1_image_url: set.task1.image, duration_minutes: 60, created_by: user.id })
  await page.route('https://placeholder.supabase.co/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    let status = 200
    let body = null
    if (url.pathname === '/auth/v1/token') body = { access_token: token, refresh_token: 'test-only-refresh', expires_in: 3600, token_type: 'bearer', user }
    else if (url.pathname === '/auth/v1/user') body = user
    else if (url.pathname === '/rest/v1/exams') {
      if (request.method() === 'POST') {
        if (rejectInsert) { status = 403; body = { message: 'Test permission failure' } }
        else {
          const input = request.postDataJSON(); const rows = Array.isArray(input) ? input : [input]
          stored.push(...rows.map((row, i) => ({ ...row, id: row.id || `exam-${stored.length+i+1}` })))
          writes++; body = null; status = 201
        }
      } else body = staleList && url.searchParams.get('select') !== 'title' ? [] : stored
    } else if (url.pathname === '/rest/v1/submissions') body = []
    else if (url.pathname === '/rest/v1/rpc/start_exam') {
      const exam = legacyExam ? { ...fromSet(bank[0]), task1_prompt: 'Custom teacher question', task2_prompt: 'Custom essay question', task1_image_url: null } : stored[0] || fromSet(bank[0])
      body = [{ ...exam, exam_id: exam.id, access_code_id: 'test-code-id', exam_title: exam.title }]
    } else if (url.pathname === '/rest/v1/rpc/submit_exam') { submitted = request.postDataJSON(); body = 'test-submission-reference' }
    else throw new Error(`Unexpected test request: ${url.pathname}`)
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto(base+'/admin')
  assert.equal(await page.getByRole('heading', { name: 'Pretest question library' }).count(), 0)
  await page.getByPlaceholder('Teacher email').fill('teacher@example.test')
  await page.getByPlaceholder('Password', { exact: true }).fill('test-only-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.getByRole('heading', { name: 'Pretest question library' }).waitFor()
  const library = page.getByRole('region', { name: 'Pretest question library' })
  await page.getByLabel('Search question library').fill('bamboo')
  assert.match(await library.textContent(), /3 of 41 pairs/)
  await library.getByRole('button', { name: /Pretest 31/ }).click()
  assert.match(await library.textContent(), /repeats pair 29/)
  await page.getByLabel('Search question library').fill('no-such-topic-xyz')
  await library.getByText('No matching questions. Try another topic.').waitFor()
  await page.getByLabel('Search question library').fill('')
  await library.getByRole('button', { name: /Pretest 01/ }).click()
  await library.getByRole('button', { name: 'Task 2', exact: true }).click()
  await library.getByRole('button', { name: 'Enlarge', exact: true }).click()
  await page.getByRole('dialog').waitFor()
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog').count(), 0)
  await library.getByRole('button', { name: 'Use this pair', exact: true }).click()
  assert.equal(await page.getByLabel('Assessment title', { exact: true }).inputValue(), bank[0].title)
  assert.match(await page.getByLabel('Task 2 question', { exact: true }).inputValue(), /Original question page/)
  rejectInsert = true
  await library.getByRole('button', { name: 'Import all assessments' }).click()
  await library.getByRole('button', { name: 'Confirm import' }).click()
  await page.getByRole('alert').filter({ hasText: 'could not be saved' }).waitFor()
  assert.equal(stored.length, 0)
  rejectInsert = false
  await library.getByRole('button', { name: 'Import all assessments' }).click()
  await library.getByRole('button', { name: 'Confirm import' }).click()
  await page.getByRole('status').filter({ hasText: '41 assessments imported' }).waitFor()
  assert.equal(stored.length, 41)
  assert.equal(writes, 1)
  assert.equal(await library.getByRole('button', { name: 'Collection imported' }).isDisabled(), true)
  assert.ok(stored.every(row => row.created_by === user.id && row.task1_image_url && row.task2_prompt.includes('[Original question page]')))
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await library.getByRole('button', { name: 'Collection imported' }).waitFor()
  assert.equal(writes, 1)
  staleList = true
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await library.getByRole('button', { name: 'Import all assessments' }).waitFor()
  await library.getByRole('button', { name: 'Import all assessments' }).click()
  await library.getByRole('button', { name: 'Confirm import' }).click()
  await page.getByRole('status').filter({ hasText: '0 assessments imported; 41 already present' }).waitFor()
  assert.equal(stored.length, 41)
  assert.equal(writes, 1)
  staleList = false
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await library.getByRole('button', { name: 'Collection imported' }).waitFor()
  const output = process.env.SCREENSHOT_DIR
  if (output) { fs.mkdirSync(output, { recursive: true }); await page.screenshot({ path: path.join(output, 'admin-library.png'), fullPage: true }) }
  console.log('PASS: teacher-only library, search, repeated-pair metadata, Task 2 source preview, zoom, form population, failed import, 41-row import, imported state and reload without duplicate writes (mock Supabase).')

  await page.goto(base)
  await page.getByPlaceholder('e.g. Alex Morgan').fill('Test Candidate')
  await page.getByPlaceholder('Enter code').fill('TEST-ONLY')
  await page.getByRole('button', { name: 'Start assessment' }).click()
  await page.getByRole('textbox', { name: 'Task 1 response' }).waitFor()
  await page.getByRole('img', { name: 'Task 1 original question', exact: true }).waitFor()
  assert.ok(await page.getByRole('img', { name: 'Task 1 original question', exact: true }).evaluate(image => image.complete && image.naturalWidth >= 800))
  await page.getByRole('textbox', { name: 'Task 1 response' }).fill('Task one answer for the teacher.')
  await page.getByRole('button', { name: /^Task 2/ }).click()
  await page.getByText('View original question page', { exact: true }).click()
  await page.getByRole('img', { name: 'Task 2 original question', exact: true }).waitFor()
  await page.getByRole('textbox', { name: 'Task 2 response' }).fill('Task two answer for the teacher.')
  assert.equal(await page.getByText('[Original question page]', { exact: false }).count(), 0)
  await page.getByText('View original question page', { exact: true }).click()
  if (output) await page.screenshot({ path: path.join(output, 'student-task2.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
  if (output) await page.screenshot({ path: path.join(output, 'student-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Submit assessment' }).click()
  await page.getByText('Assessment submitted', { exact: true }).waitFor()
  assert.equal(submitted.input_task1, 'Task one answer for the teacher.')
  assert.equal(submitted.input_task2, 'Task two answer for the teacher.')
  legacyExam = true
  await page.goto(base)
  await page.getByPlaceholder('e.g. Alex Morgan').fill('Legacy Candidate')
  await page.getByPlaceholder('Enter code').fill('LEGACY-TEST')
  await page.getByRole('button', { name: 'Start assessment' }).click()
  await page.getByText('Custom teacher question', { exact: true }).waitFor()
  await page.getByRole('button', { name: /^Task 2/ }).click()
  await page.getByText('Custom essay question', { exact: true }).waitFor()
  assert.equal(await page.getByText('View original question page', { exact: true }).count(), 0)
  assert.equal(runtimeErrors.length, 0, runtimeErrors.join('\n'))
  console.log('PASS: student start, both question images, editable empty answers, mobile layout, submission payload and existing custom-exam compatibility (mock Supabase). No browser runtime errors.')
} finally { await browser.close() }
