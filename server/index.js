import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'kn', targetLang = 'en' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required for translation.' });
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Translate API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // The response from this free API is an array where the first element 
    // contains an array of translated segments. We need to concatenate them.
    let translatedText = '';
    if (data && data[0]) {
      data[0].forEach(segment => {
        if (segment[0]) {
          translatedText += segment[0];
        }
      });
    }

    res.json({ translatedText });
  } catch (error) {
    console.error('Translation Error:', error.message);
    res.status(500).json({ error: 'Failed to translate. Please try again later.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
