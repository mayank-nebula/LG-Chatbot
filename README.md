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
      const response = await fetch("http://localhost:8000/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: topic }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      const resultDiv = document.getElementById("result");
      let partialChunk = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialChunk += decoder.decode(value, { stream: true });

        // Process each complete JSON object
        let boundary = partialChunk.lastIndexOf("}\n{") + 1;  // Assuming each JSON object is separated by a newline
        if (boundary === 0) boundary = partialChunk.lastIndexOf("}") + 1;  // In case there is no "\n{" separator

        while (boundary > 0) {
          const completeChunk = partialChunk.slice(0, boundary);
          partialChunk = partialChunk.slice(boundary);

          completeChunk.split("\n").forEach(obj => {
            if (obj.trim().length > 0) {
              try {
                const parsedResponse = JSON.parse(obj);
                if (parsedResponse.type === "text") {
                  resultDiv.innerHTML += marked.parse(parsedResponse.content);
                } else if (parsedResponse.type === "sources" || parsedResponse.type === "chatId") {
                  console.log(`${parsedResponse.type}:`, parsedResponse.content);
                }
              } catch (e) {
                // Handle JSON parsing error
                console.error("Error parsing JSON chunk:", obj, e);
              }
            }
          });

          boundary = partialChunk.lastIndexOf("}\n{") + 1;
          if (boundary === 0) boundary = partialChunk.lastIndexOf("}") + 1;
        }
      }

      // Handle any remaining incomplete JSON object
      if (partialChunk.trim().length > 0) {
        try {
          const parsedResponse = JSON.parse(partialChunk);
          if (parsedResponse.type === "text") {
            resultDiv.innerHTML += marked.parse(parsedResponse.content);
          } else if (parsedResponse.type === "sources" || parsedResponse.type === "chatId") {
            console.log(`${parsedResponse.type}:`, parsedResponse.content);
          }
        } catch (e) {
          // Handle JSON parsing error
          console.error("Error parsing remaining JSON chunk:", partialChunk, e);
        }
      }
    });
  </script>
</body>
</html>
