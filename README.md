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
        const response = await fetch("https://20.191.112.232/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: topic }),
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        const resultDiv = document.getElementById("result");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let boundary = buffer.lastIndexOf('}');
          if (boundary !== -1) {
            let toProcess = buffer.slice(0, boundary + 1);
            buffer = buffer.slice(boundary + 1);

            let items = toProcess.split('}{').join('}\n{').split('\n');
            for (let item of items) {
              if (item.trim()) {
                let parsedChunk;
                try {
                  parsedChunk = JSON.parse(item);
                } catch (e) {
                  console.error("Error parsing chunk:", e);
                  continue;
                }

                if (parsedChunk.type === "text") {
                  resultDiv.innerHTML += marked.parse(parsedChunk.content);
                }
              }
            }
          }
        }
      });
    </script>
  </body>
</html>
