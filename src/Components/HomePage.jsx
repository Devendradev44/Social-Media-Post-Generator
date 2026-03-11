import React from "react";
import { useState } from "react";
import "./HomePage.css";
function HomePage() {
  const [formData, setFormData] = useState({
    rawText : "",
    platforms : []
  });

  const [parsedPosts, setParsedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    // JSON parsing approach is used now; legacy regex parser removed.

  async function ContactGemini(){
    if (!formData.rawText.trim()) {
      setError("Please enter raw text");
      return;
    }
    if (formData.platforms.length === 0) {
      setError("Please select at least one platform");
      return;
    }

    setLoading(true);
    setError("");
    setParsedPosts([]);

        try{
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
            if (!apiKey) {
                setError('Missing API key. Set VITE_GEMINI_API_KEY in .env');
                setLoading(false);
                return;
            }

            const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: `Generate engaging social media posts.\n\nRaw text:\n${formData.rawText}\n\nPlatforms:\n${formData.platforms.join(', ')}\n\nReturn ONLY valid JSON in this format:\n\n{\n  "posts": [\n    {\n      "platform": "LinkedIn",\n      "content": "post text"\n    }\n  ]\n}`
                            }
                        ]
                    }
                ]
            };

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': apiKey
                },
                body: JSON.stringify(requestBody)
            };

            console.log('Sending request to Gemini API...', url);
            console.log('Request body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(url, options);

            console.log('Response status:', response.status);

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch {
                    const text = await response.text();
                    console.error('Raw error response:', text);
                    setError(`API Error: ${response.status} - Raw response: ${text.substring(0, 200)}`);
                    setLoading(false);
                    return;
                }

                console.error('API Error Response:', errorData);
                const errorMsg = errorData.error?.message || errorData.message || 'Unknown error';
                setError(`API Error: ${response.status} - ${errorMsg}`);
                setLoading(false);
                return;
            }

            const data = await response.json();
            console.log('Full API Response:', data);

            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) {
                setError('Unexpected response format from API');
                console.error('Unexpected response:', data);
                setLoading(false);
                return;
            }

            let parsed;
            try {
                parsed = JSON.parse(rawText);
            } catch {
                setError('Invalid JSON returned from AI');
                console.error('Invalid JSON returned from AI:', rawText);
                setLoading(false);
                return;
            }

            if (!parsed.posts || !Array.isArray(parsed.posts)) {
                setError('Invalid posts format returned from AI');
                setLoading(false);
                return;
            }

            setParsedPosts(parsed.posts);
            console.log('Parsed Posts: ', parsed.posts);
            setLoading(false);
        }
    catch(error){
        console.error('Error in contacting Gemini API:', error);
        setError(`Error: ${error.message}`);
        setLoading(false);
    }
  }


  return (
    <div className="container">
        <h1>📱 Social Media Post Generator</h1>
        <p className="subtitle">Generate engaging social media posts powered by AI</p>
        
        <div className="form-section">
            <div className="form-group">
                <h3>📝 Enter Your Raw Text</h3>
                <textarea 
                    name="rawText" 
                    id="rawText" 
                    rows={12} 
                    placeholder="Paste your content here... It will be transformed into platform-specific posts"
                    onChange={e=>setFormData({...formData, rawText: e.target.value})} 
                    value={formData.rawText}
                />
            </div>

            <div className="form-group">
                <h3>🎯 Select Your Platforms</h3>
                <div className="checkbox-group">
                    <label className="checkbox-item">
                        <input 
                            type="checkbox" 
                            name="platforms" 
                            id="linkedin" 
                            value={'Linkedin'} 
                            onChange={(e)=>{
                                if(e.target.checked){
                                    setFormData({
                                        ...formData,
                                        platforms : [...formData.platforms, e.target.value]
                                    })
                                }
                                else if(!e.target.checked){
                                    setFormData({
                                        ...formData,
                                        platforms : formData.platforms.filter((platform) => platform !== e.target.value)
                                    })
                                }
                            }} 
                        />
                        <span>LinkedIn</span>
                    </label>

                    <label className="checkbox-item">
                        <input 
                            type="checkbox" 
                            name="platforms" 
                            id="instagram" 
                            value={'Instagram'} 
                            onChange={(e)=>{
                                if(e.target.checked){
                                    setFormData({
                                        ...formData,
                                        platforms : [...formData.platforms, e.target.value]
                                    })
                                }
                                else if(!e.target.checked){
                                    setFormData({
                                        ...formData,
                                        platforms : formData.platforms.filter((platform) => platform !== e.target.value)
                                    })
                                }
                            }} 
                        />
                        <span>Instagram</span>
                    </label>

                    <label className="checkbox-item">
                        <input 
                            type="checkbox" 
                            name="platforms" 
                            id="twitter" 
                            value={'Twitter'} 
                            onChange={(e)=>{
                                if(e.target.checked){
                                    setFormData({
                                        ...formData,
                                        platforms : [...formData.platforms, e.target.value]
                                    })
                                }
                                else if(!e.target.checked){
                                    setFormData({
                                        ...formData,
                                        platforms : formData.platforms.filter((platform) => platform !== e.target.value)
                                    })
                                }
                            }} 
                        />
                        <span>Twitter/X</span>
                    </label>
                </div>
            </div>

            <button type="button" onClick={()=>{ContactGemini()}} disabled={loading}>
                {loading ? '⏳ Generating...' : '✨ Generate Posts'}
            </button>
        </div>

        {error && (
            <div className="status-message error-message">
                <strong>❌ Error:</strong> {error}
            </div>
        )}
        
        {loading && (
            <div className="status-message loading-message">
                <strong>⏳ Processing your request...</strong> This may take a few seconds.
            </div>
        )}
        
        {parsedPosts.length > 0 && (
            <div className="responses-section">
                <h2 className="posts-title">🎨 Generated Social Media Posts</h2>
                <div className="posts-container">
                    {parsedPosts.map((post, index) => (
                        <div 
                            key={index} 
                            className={`post-card ${post.platform.toLowerCase()}`}
                        >
                            <div className="post-header">
                                <h3>{post.platform}</h3>
                            </div>
                            <div className="post-content">
                                <p>{post.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
}

export default HomePage;