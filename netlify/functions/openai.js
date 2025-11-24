const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            console.error('OPENAI_API_KEY not configured');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server not configured' })
            };
        }

        const data = JSON.parse(event.body);
        const prompt = generatePrompt(data);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
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
                max_tokens: 2500
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: error.error?.message || 'OpenAI error' })
            };
        }

        const result = await response.json();
        const report = result.choices[0].message.content;

        return {
            statusCode: 200,
            body: JSON.stringify({ report: formatReport(report) })
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
    return `צור דוח אבחון תעסוקתי מקצועי:
    
גיל: ${data.age}
מגדר: ${data.gender}
מיקום: ${data.location}

יכולות קוגניטיביות (1-10):
- כמותית: ${data.cognitive?.quantitative}
- מילולית: ${data.cognitive?.verbal}
- חזותית: ${data.cognitive?.visual}
- טכנית: ${data.cognitive?.technical}

Holland RIASEC (1-10):
- Realistic: ${data.holland?.realistic}
- Investigative: ${data.holland?.investigative}
- Artistic: ${data.holland?.artistic}
- Social: ${data.holland?.social}
- Enterprising: ${data.holland?.enterprising}
- Conventional: ${data.holland?.conventional}

הישגים: ${data.achievements}
תחביבים: ${data.hobbies}

שאיפות: ${data.aspirations}
חסמים: ${data.blockers}

צור דוח עם:
1. תקציר אישי
2. פרופיל יכולות
3. Holland analysis
4. Hobby-to-Career opportunities
5. 5-8 משרות מומלצות
6. 3-5 קורסים מומלצים
7. תוכנית פעולה
8. משפט העצמה`;
}

function formatReport(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(?!<)/gm, '<p>')
        .replace(/(?<![>])\n*$/gm, '</p>');
}
