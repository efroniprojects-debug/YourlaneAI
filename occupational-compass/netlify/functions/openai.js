const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const { apiKey, ...diagnosticData } = data;

        if (!apiKey || !apiKey.startsWith('sk-')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid API Key' })
            };
        }

        const prompt = generatePrompt(diagnosticData);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${apiKey}\`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'אתה מאבחן תעסוקתי מוסמך עם 15+ שנות ניסיון. צור דוח תעסוקתי מקצועי בעברית.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI Error:', error);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: error.error?.message || 'OpenAI API error' })
            };
        }

        const result = await response.json();
        const report = result.choices[0].message.content;

        return {
            statusCode: 200,
            body: JSON.stringify({
                report: formatReport(report)
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

function generatePrompt(data) {
    return \`
בהתאם לנתונים הבאים, צור דוח אבחון תעסוקתי מקצועי:

**נתונים אישיים:**
- גיל: \${data.age}
- מגדר: \${data.gender}
- מיקום: \${data.location}

**יכולות קוגניטיביות (1-10):**
- כמותית: \${data.cognitive.quantitative}
- מילולית: \${data.cognitive.verbal}
- חזותית: \${data.cognitive.visual}
- טכנית: \${data.cognitive.technical}

**Holland RIASEC (1-10):**
- Realistic: \${data.holland.realistic}
- Investigative: \${data.holland.investigative}
- Artistic: \${data.holland.artistic}
- Social: \${data.holland.social}
- Enterprising: \${data.holland.enterprising}
- Conventional: \${data.holland.conventional}

**הישגים:** \${data.achievements}

**תחביבים:** \${data.hobbies}

**העדפות:**
- סביבה: \${data.workEnv}
- קצב: \${data.pace}
- מיקום עבודה: \${data.location2}

**שאיפות:** \${data.aspirations}

**חסמים:** \${data.blockers}

צור דוח המכיל:
1. **תקציר אישי** (3-5 שורות)
2. **פרופיל יכולות** (עם ציונים)
3. **Holland RIASEC Analysis** (דירוג וסיבה)
4. **Hobby-to-Career** (כיצד התחביבים יכולים להפוך לקריירה)
5. **5-8 משרות מומלצות** (עם נימוקים וציון התאמה)
6. **3-5 קורסים/הכשרות** מומלצים
7. **תוכנית פעולה** (שבוע 1, חודש 1, 3 חודשים)
8. **משפט העצמה** מסכם

פורמט: HTML עם כותרות ברורות וסימנים.
    \`;
}

function formatReport(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/gm, '<p>')
        .replace(/$/gm, '</p>')
        .replace(/<p><p>/g, '<p>')
        .replace(/<\/p><\/p>/g, '</p>');
}
