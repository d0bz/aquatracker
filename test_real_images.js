require('dotenv').config();
const fs = require('fs');
const path = require('path');
const apiKey = process.env.GEMINI_API_KEY;

const files = fs.readdirSync('sample_images').filter(f => f.endsWith('.jpg') && f.startsWith('2026'));

async function inspectImages() {
  for (const file of files) {
    const filePath = path.join('sample_images', file);
    console.log('\n=== Analyzing file:', file, '===');
    const base64Data = fs.readFileSync(filePath).toString('base64');
    
    const prompt = `
      You are an expert AI water meter reading system.
      Analyze this real water meter photo carefully and extract:
      1. "handwrittenLabel": Look for any handwritten marker/number (e.g., "1", "2", "3", "4", "5", "Meter 1", etc.) written on the pipe, sticker, tag, tape, wall, or meter body.
      2. "reading": The numerical water meter reading value in m³. Look at the main counter display (black integer m³ wheels and red decimal wheels/dials if present).
      3. "meterNumber": The printed serial number/meter ID printed on the faceplate or body (e.g. WM-..., barcode, or serial number).
      4. "confidence": Confidence score 0-100.
      5. "explanation": Description of what you see (handwritten label location, counter digits, meter serial).

      Output MUST be valid JSON only:
      {
        "handwrittenLabel": "1",
        "reading": 123.45,
        "meterNumber": "123456",
        "confidence": 95,
        "explanation": "..."
      }
    `;

    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
            ]
          }]
        })
      });

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('Result for', file, ':\n', text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      console.error('Error for', file, ':', e.message);
    }
  }
}

inspectImages();
