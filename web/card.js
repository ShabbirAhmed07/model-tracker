import { observationDate, observationLabel } from './share.js'

function fitLine(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text
  const characters = Array.from(text)
  while (characters.length && context.measureText(`${characters.join('')}…`).width > maxWidth) characters.pop()
  return `${characters.join('')}…`
}

function wrapTitle(context, text, maxWidth) {
  const words = text.split(/\s+/)
  const lines = ['']
  for (const word of words) {
    const index = lines.length - 1
    const next = lines[index] ? `${lines[index]} ${word}` : word
    if (context.measureText(next).width <= maxWidth) lines[index] = next
    else if (!lines[index]) lines[index] = fitLine(context, word, maxWidth)
    else if (lines.length < 2) lines.push(fitLine(context, word, maxWidth))
    else {
      lines[index] = fitLine(context, `${lines[index]} ${word}`, maxWidth)
      break
    }
  }
  return lines
}

function loadLogo() {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('AI Insta logo could not be loaded'))
    image.src = './ai-insta-logo.png'
  })
}

export async function renderShareCard(canvas, event) {
  const logo = await loadLogo()
  canvas.width = 1200
  canvas.height = 675
  const context = canvas.getContext('2d')
  context.fillStyle = '#080b12'
  context.fillRect(0, 0, 1200, 675)
  context.strokeStyle = '#313b50'
  context.lineWidth = 1
  context.strokeRect(20.5, 20.5, 1159, 634)
  context.fillStyle = '#1fcce8'
  context.fillRect(68, 61, 43, 4)
  context.fillStyle = '#62dce8'
  context.font = '700 22px sans-serif'
  context.fillText(observationLabel(event), 68, 105)
  if (event.openWeights) {
    context.font = '700 18px sans-serif'
    context.fillStyle = '#92dbb1'
    context.fillText('OPEN WEIGHTS', 68, 137)
  }
  context.fillStyle = '#f5f7fb'
  context.font = '700 62px sans-serif'
  const lines = wrapTitle(context, event.name, 920)
  lines.forEach((line, index) => context.fillText(line, 68, 223 + index * 72))
  context.fillStyle = '#aebbd0'
  context.font = '600 28px sans-serif'
  context.fillText(event.category === 'huggingface' ? 'Hugging Face' : 'models.dev', 68, 354)
  context.fillStyle = '#79d8ec'
  context.font = '600 23px monospace'
  context.fillText(fitLine(context, event.modelId, 1030), 68, 421)
  context.fillStyle = '#aebbd0'
  context.font = '22px sans-serif'
  context.fillText(observationDate(event), 68, 511)
  context.font = '17px sans-serif'
  context.fillStyle = '#8796aa'
  context.fillText('A catalog sighting is not proof of a launch.', 68, 544)
  context.strokeStyle = '#303d50'
  context.beginPath()
  context.moveTo(68, 568)
  context.lineTo(1132, 568)
  context.stroke()
  context.drawImage(logo, 68, 584, 48, 48)
  context.fillStyle = '#f5f7fb'
  context.font = '700 23px sans-serif'
  context.fillText('AI Insta', 129, 608)
  context.fillStyle = '#98a7be'
  context.font = '18px sans-serif'
  context.fillText('@AI_Insta07', 129, 632)
  context.drawImage(logo, 1018, 63, 100, 100)
}