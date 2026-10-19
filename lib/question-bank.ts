import collection from './question-bank.json'

export const questionBank = collection
export type QuestionSet = (typeof questionBank)[number]
export type SourceQuestion = QuestionSet['task1']

// Store the original page as a standard Markdown link inside the existing prompt
// column. This keeps the import compatible with the deployed database/RPCs.
const sourcePattern = /\n\n\[Original question page\]\((\/question-bank\/pages\/page-\d{2}\.webp)\)$/

export function withSourcePage(prompt: string, image: string) {
  if (!/^\/question-bank\/pages\/page-\d{2}\.webp$/.test(image)) {
    throw new Error('Invalid question source page')
  }
  return `${prompt}\n\n[Original question page](${image})`
}

export function readSourcePage(prompt: string) {
  const match = prompt.match(sourcePattern)
  return { text: match ? prompt.slice(0, match.index) : prompt, image: match?.[1] ?? null }
}

export function assessmentFromSet(set: QuestionSet) {
  return {
    title: set.title,
    task1_prompt: withSourcePage(set.task1.prompt, set.task1.image),
    task2_prompt: withSourcePage(set.task2.prompt, set.task2.image),
    task1_image_url: set.task1.image,
    duration_minutes: 60,
  }
}
