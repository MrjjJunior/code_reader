/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState } from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [documentation, setDocumentation] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setIsProcessing(true);
      
      const formData = new FormData();
      formData.append('codeFile', uploadedFile);

      try {
        const response = await fetch('/generate-docs', {
          method: 'POST',
          body: formData
        });

        const result = await response.text();
        setDocumentation(result);
        setIsProcessing(false);
      } catch (error) {
        console.error("Documentation generation failed", error);
        setIsProcessing(false);
      }
    }
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px' 
    }}>
      <h1>🤖 CodeDocs AI</h1>
      <input 
        type="file" 
        onChange={handleFileUpload}
        accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.rb"
      />
      {isProcessing && <p>⏳ Generating documentation...</p>}
      {documentation && (
        <div>
          <h2>Generated Documentation</h2>
          <pre style={{ 
            backgroundColor: '#f4f4f4', 
            padding: '15px', 
            borderRadius: '5px', 
            overflowX: 'auto' 
          }}>
            {documentation}
          </pre>
        </div>
      )}
      <a 
        href={import.meta.url.replace("esm.town", "val.town")} 
        target="_top" 
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.8em' }}
      >
        View Source
      </a>
    </div>
  );
}

function client() {
  createRoot(document.getElementById("root")).render(<App />);
}
if (typeof document !== "undefined") { client(); }

export default async function server(request: Request): Promise<Response> {
  if (request.method === 'POST' && request.url.includes('/generate-docs')) {
    const { OpenAI } = await import("https://esm.town/v/std/openai");
    const openai = new OpenAI();

    const formData = await request.formData();
    const codeFile = formData.get('codeFile') as File;
    
    if (!codeFile) {
      return new Response("No file uploaded", { status: 400 });
    }

    const fileContent = await codeFile.text();

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system", 
            content: `You are an expert code documentation generator. 
            For the provided code, generate comprehensive documentation that includes:
            1. Overall project/file description
            2. Detailed function/method summaries
            3. Class structure and inheritance
            4. Usage examples
            5. Potential edge cases or considerations
            
            Format the output as clean, readable markdown.`
          },
          {
            role: "user", 
            content: `Analyze and document the following code:\n\n${fileContent}`
          }
        ],
        max_tokens: 1500
      });

      const documentation = completion.choices[0].message.content || "No documentation generated";

      return new Response(documentation, {
        headers: { 
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error("OpenAI processing error:", error);
      return new Response("Documentation generation failed", { status: 500 });
    }
  }

  return new Response(`
    <html>
      <head>
        <title>CodeDocs AI</title>
        <style>${css}</style>
      </head>
      <body>
        <div id="root"></div>
        <script src="https://esm.town/v/std/catch"></script>
        <script type="module" src="${import.meta.url}"></script>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

const css = `
body { 
  font-family: system-ui, sans-serif; 
  line-height: 1.6; 
  color: #333; 
  max-width: 800px; 
  margin: 0 auto; 
  padding: 20px;
}
`;