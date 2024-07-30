<!DOCTYPE html>
<html>
  <head>
    <title>Markdown Generator</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  </head>
  <body>
    <h1>Markdown Generator</h1>
    <form id="topic-form">
      <label for="topic">Enter a topic:</label>
      <input type="text" id="topic" name="topic" />
      <button type="submit">Generate</button>
    </form>
    <div id="result"></div>
    <script>
      document.getElementById("topic-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const topic = document.getElementById("topic").value;
        const resultDiv = document.getElementById("result");

        try {
          const response = await fetch(`https://localhost:443/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic }),
          });

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let fullText = '';
          let sources = '';
          let chatId = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);

            try {
              const parsed = JSON.parse(chunk);
              if (parsed.type === 'text') {
                fullText += parsed.content;
                resultDiv.innerHTML = marked.parse(fullText);
              } else if (parsed.type === 'sources') {
                sources = parsed.content;
              } else if (parsed.type === 'chatId') {
                chatId = parsed.content;
              }
            } catch (e) {
              console.error('Failed to parse chunk:', chunk, e);
            }
          }

          // Format and display sources and chatId
          if (sources) {
            console.log('Sources:', sources);
            // You can update your UI to show sources here
          }

          if (chatId) {
            console.log('Chat ID:', chatId);
            // You can update your UI to show chatId here
          }
        } catch (error) {
          console.error('Error:', error);
        }
      });
    </script>
  </body>
</html>
